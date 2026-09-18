import { useState, useMemo, useEffect } from "react";
import { TAB_ORDER } from "../lib/constants.js";
import { TODAY, daysUntil, computeForecast } from "../lib/forecast.js";
import { supabase } from "../lib/supabase.js";
import AuthScreen from "../screens/AuthScreen.jsx";
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

const seedSystems = [
  { id: "sys1", brand: "Carrier", model: "Infinity", category: "hvac", location: "Attic", purchaseDate: "2021-06-01", purchasePrice: 8400, expectedLifeYears: 15, replacementCost: 10000, warrantyExpiration: "2031-06-01" },
  { id: "sys2", brand: "Rheem", model: "Performance", category: "water_heater", location: "Garage", purchaseDate: "2016-03-01", purchasePrice: 1200, expectedLifeYears: 10, replacementCost: 1800, warrantyExpiration: "2022-03-01" },
  { id: "sys3", brand: "GAF", model: "Timberline", category: "roof", location: "Whole house", purchaseDate: "2014-08-01", purchasePrice: 12000, expectedLifeYears: 25, replacementCost: 16500, warrantyExpiration: "2044-08-01" },
  { id: "sys4", brand: "Whirlpool", model: "WDT750", category: "appliance", location: "Kitchen", purchaseDate: "2024-06-14", purchasePrice: 899, expectedLifeYears: 10, replacementCost: 1050, warrantyExpiration: "2029-06-14" },
  { id: "sys5", brand: "Square D", model: "Homeline 200A", category: "electrical", location: "Garage", purchaseDate: "2014-08-01", purchasePrice: 2200, expectedLifeYears: 30, replacementCost: 3500, warrantyExpiration: "" },
];

const seedTasks = [
  { id: "t1", systemId: "sys1", title: "Replace air filter", dueDate: "2026-09-26", completed: false, duration: "25 mins", difficulty: "Hard" },
  { id: "t2", systemId: "sys2", title: "Annual inspection", dueDate: "2026-10-31", completed: false, duration: "10 mins", difficulty: "Easy" },
  { id: "t3", systemId: "sys3", title: "Roof inspection", dueDate: "2026-12-14", completed: false, duration: "5 mins", difficulty: "Easy" },
  { id: "t4", systemId: "sys4", title: "Clean filter trap", dueDate: "2026-11-05", completed: false, duration: "15 mins", difficulty: "Medium" },
];

const seedExpenses = [
  { id: "e1", systemId: "sys1", amount: 145, date: "2026-03-12", category: "Maintenance", note: "Spring HVAC tune-up" },
  { id: "e2", systemId: "sys3", amount: 620, date: "2026-05-02", category: "Repair", note: "Flashing repair" },
  { id: "e3", systemId: null, amount: 482, date: "2026-07-18", category: "Maintenance", note: "Gutter cleaning" },
];

const seedDocuments = [
  { id: "d1", systemId: "sys1", type: "Warranty", label: "Carrier Infinity warranty card" },
  { id: "d2", systemId: "sys1", type: "Invoice", label: "Installation invoice" },
  { id: "d3", systemId: "sys4", type: "Receipt", label: "Whirlpool purchase receipt" },
  { id: "d4", systemId: "sys3", type: "Invoice", label: "Roof repair invoice" },
];

const seedFurniture = [
  { id: "f1", name: "Sectional Sofa", room: "Living Room", value: 1400, note: "Gray fabric, 3-piece", photoUrl: null },
  { id: "f2", name: "Coffee Table", room: "Living Room", value: 280, note: "Reclaimed wood", photoUrl: null },
  { id: "f3", name: "Dining Table & Chairs", room: "Dining Room", value: 850, note: "Seats 6, oak, set of 6 chairs", photoUrl: null },
  { id: "f4", name: "Queen Bed Frame", room: "Bedroom", value: 600, note: "Upholstered headboard", photoUrl: null },
  { id: "f5", name: "Dresser", room: "Bedroom", value: 420, note: "6-drawer, walnut finish", photoUrl: null },
  { id: "f6", name: "Vanity Cabinet", room: "Bathroom", value: 350, note: "Double sink, marble top", photoUrl: null },
];

const STORAGE_KEY = "myhouse-os-state";

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function MyHouseOS() {
  const [saved] = useState(loadSavedState);

  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  const [tab, setTab] = useState("home");
  const [slideDirection, setSlideDirection] = useState("right");
  const [systems, setSystems] = useState(saved?.systems || seedSystems);
  const [tasks, setTasks] = useState(saved?.tasks || seedTasks);
  const [expenses, setExpenses] = useState(saved?.expenses || seedExpenses);
  const [documents, setDocuments] = useState(saved?.documents || seedDocuments);
  const [furniture, setFurniture] = useState(saved?.furniture || seedFurniture);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [formItem, setFormItem] = useState(null); // { kind: 'task' | 'expense' | 'system' | 'doc' | 'furniture', item: object | null }
  const [profile, setProfile] = useState({
    name: "Alex Carter",
    email: "alex@example.com",
    address: "1814 Ashborough Road SE, Unit E, Marietta, GA 30067",
    propertyValue: 178441,
    propertyValueSource: "Redfin Estimate",
    plan: "free",
    ...saved?.profile,
  });

  useEffect(() => {
    if (session?.user?.email && !saved?.profile?.email) {
      setProfile((p) => ({ ...p, email: session.user.email }));
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ systems, tasks, expenses, documents, furniture, profile }));
    } catch {
      // storage unavailable or full — persistence is best-effort
    }
  }, [systems, tasks, expenses, documents, furniture, profile]);

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

  function closeForm() {
    setSlideDirection("left");
    setFormItem(null);
  }

  function toggleTask(id) {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === id
          ? t.completed
            ? { ...t, completed: false, reopenedAt: Date.now() }
            : { ...t, completed: true, reopenedAt: null }
          : t
      )
    );
  }

  function addTask(title, dueDate, systemId) {
    setTasks((ts) => [...ts, { id: "t" + Date.now(), systemId, title, dueDate, completed: false }]);
    closeForm();
  }

  function updateTask(id, patch) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    closeForm();
  }

  function deleteTask(id) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    closeForm();
  }

  function addExpense(amount, category, note, systemId) {
    setExpenses((es) => [
      ...es,
      { id: "e" + Date.now(), systemId, amount, category, note, date: TODAY.toISOString().slice(0, 10) },
    ]);
    closeForm();
  }

  function updateExpense(id, patch) {
    setExpenses((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    closeForm();
  }

  function deleteExpense(id) {
    setExpenses((es) => es.filter((e) => e.id !== id));
    closeForm();
  }

  function addDocument(label, type, systemId, photoUrl) {
    setDocuments((ds) => [...ds, { id: "d" + Date.now(), label, type, systemId, photoUrl: photoUrl || null }]);
    closeForm();
  }

  function updateDocument(id, patch) {
    setDocuments((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    closeForm();
  }

  function deleteDocument(id) {
    setDocuments((ds) => ds.filter((d) => d.id !== id));
    closeForm();
  }

  function addFurniture(item) {
    setFurniture((fs) => [...fs, { id: "f" + Date.now(), ...item }]);
    closeForm();
  }

  function updateFurniture(id, patch) {
    setFurniture((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    closeForm();
  }

  function deleteFurniture(id) {
    setFurniture((fs) => fs.filter((f) => f.id !== id));
    closeForm();
  }

  function addSystem(sys) {
    setSystems((ss) => [...ss, { id: "sys" + Date.now(), ...sys }]);
    closeForm();
  }

  function updateSystem(id, patch) {
    setSystems((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSelectedSystem((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
    closeForm();
  }

  function deleteSystem(id) {
    setSystems((ss) => ss.filter((s) => s.id !== id));
    setSlideDirection("left");
    setSelectedSystem(null);
    setFormItem(null);
  }

  function saveProfile(next) {
    setProfile((p) => ({ ...p, ...next }));
    closeForm();
  }

  function selectPlan(planId) {
    setProfile((p) => ({ ...p, plan: planId }));
    closeForm();
  }

  function signOut() {
    supabase.auth.signOut();
  }

  if (session === undefined) return null;

  if (!session) {
    return (
      <div
        className="mx-auto"
        style={{
          maxWidth: 400,
          background: "#F5F8F0",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
          border: "1px solid #E0E8D3",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div className="px-4 pt-5 pb-4">
          <AuthScreen />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 400,
        background: "#F5F8F0",
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        border: "1px solid #E0E8D3",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ height: 560, overflowY: "auto", overflowX: "hidden", position: "relative" }} className="px-4 pt-5 pb-4">
        <div
          key={formItem ? `${tab}:form:${formItem.kind}:${formItem.item?.id ?? "new"}` : selectedSystem ? `${tab}:system:${selectedSystem.id}` : tab}
          className={slideDirection === "right" ? "tab-slide-right" : "tab-slide-left"}
        >
          {formItem?.kind === "profile" ? (
            <EditProfileScreen profile={profile} onBack={closeForm} onSave={saveProfile} />
          ) : formItem?.kind === "plan" ? (
            <PlanScreen currentPlan={profile.plan} onBack={closeForm} onSelectPlan={selectPlan} />
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
                  onOpenSystem={(s) => {
                    setSelectedSystem(s);
                    goToTab("systems");
                  }}
                  onOpenAccount={() => goToTab("account")}
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
                  onAdd={() => openAdd("system")}
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
        </div>
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
