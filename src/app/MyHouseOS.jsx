import React, { useState, useMemo } from "react";
import {
  Home, Wrench, CalendarCheck, Banknote, FileText, Plus, ChevronRight,
  ChevronLeft, X, Check, AlertTriangle, Wind, Droplet, Zap, Shield, Circle,
  User, Clock, LayoutGrid, Pencil
} from "lucide-react";

const PRIMARY = "#16240F";
const HERO_BG_TOP = "#D3ECBC";
const HERO_BG_BOTTOM = "#BEE1A5";
const ACCENT_YELLOW = "#F3EA6B";

const TODAY = new Date("2026-09-14");

const TAB_ORDER = ["home", "systems", "tasks", "costs", "docs", "account"];

const CATEGORY_META = {
  hvac: { label: "HVAC", icon: Wind },
  water_heater: { label: "Water heater", icon: Droplet },
  roof: { label: "Roof", icon: Home },
  plumbing: { label: "Plumbing", icon: Droplet },
  electrical: { label: "Electrical", icon: Zap },
  appliance: { label: "Appliance", icon: Wrench },
};

const seedSystems = [
  { id: "sys1", name: "Carrier Infinity", category: "hvac", location: "Attic", purchaseDate: "2021-06-01", purchasePrice: 8400, expectedLifeYears: 15, replacementCost: 10000, warrantyExpiration: "2031-06-01" },
  { id: "sys2", name: "Rheem Performance", category: "water_heater", location: "Garage", purchaseDate: "2016-03-01", purchasePrice: 1200, expectedLifeYears: 10, replacementCost: 1800, warrantyExpiration: "2022-03-01" },
  { id: "sys3", name: "GAF Timberline", category: "roof", location: "Whole house", purchaseDate: "2014-08-01", purchasePrice: 12000, expectedLifeYears: 25, replacementCost: 16500, warrantyExpiration: "2044-08-01" },
  { id: "sys4", name: "Whirlpool WDT750", category: "appliance", location: "Kitchen", purchaseDate: "2024-06-14", purchasePrice: 899, expectedLifeYears: 10, replacementCost: 1050, warrantyExpiration: "2029-06-14" },
  { id: "sys5", name: "Main panel", category: "electrical", location: "Garage", purchaseDate: "2014-08-01", purchasePrice: 2200, expectedLifeYears: 30, replacementCost: 3500, warrantyExpiration: "" },
];

const seedTasks = [
  { id: "t1", systemId: "sys1", title: "Replace air filter", dueDate: "2026-09-26", completed: false, duration: "25 mins", difficulty: "Hard" },
  { id: "t2", systemId: "sys2", title: "Annual inspection", dueDate: "2026-10-31", completed: false, duration: "10 mins", difficulty: "Easy" },
  { id: "t3", systemId: "sys3", title: "Roof inspection", dueDate: "2026-12-14", completed: false, duration: "5 mins", difficulty: "Easy" },
  { id: "t4", systemId: "sys4", title: "Clean filter trap", dueDate: "2026-11-05", completed: false, duration: "15 mins", difficulty: "Medium" },
];

const seedRecommendations = [
  { id: "r1", title: "Energy Audit", subtitle: "3 of 6 efficiency checks need attention", cta: "Save Now", highlight: true },
  { id: "r2", title: "Water Bill", subtitle: "Save $100 every month with a simple fix", cta: null, highlight: false },
  { id: "r3", title: "Filter Reminder", subtitle: "Set auto-reminders for HVAC filters", cta: null, highlight: false },
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

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.round((d - TODAY) / 86400000);
}

function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function replacementYear(sys) {
  return new Date(sys.purchaseDate).getFullYear() + sys.expectedLifeYears;
}

function systemStatus(sys, tasks) {
  const relevant = tasks.filter((t) => t.systemId === sys.id && !t.completed);
  if (relevant.length === 0) return "green";
  const soonest = Math.min(...relevant.map((t) => daysUntil(t.dueDate)));
  if (soonest < 0) return "red";
  if (soonest <= 30) return "yellow";
  return "green";
}

const STATUS_COLOR = {
  green: "#3B6D11",
  yellow: "#BA7517",
  red: "#A32D2D",
};
const STATUS_BG = {
  green: "#EAF3DE",
  yellow: "#FAEEDA",
  red: "#FCEBEB",
};

function TabBar({ active, onChange }) {
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "systems", label: "Systems", icon: Wrench },
    { id: "tasks", label: "Tasks", icon: CalendarCheck },
    { id: "costs", label: "Costs", icon: Banknote },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "account", label: "Account", icon: User },
  ];
  return (
    <div className="flex border-t border-stone-200 bg-white">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
          >
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.7} color={isActive ? PRIMARY : "#9C978C"} />
            <span
              className="text-[10px]"
              style={{ color: isActive ? PRIMARY : "#9C978C", fontWeight: isActive ? 600 : 400 }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LedgerRow({ label, sub, value, valueColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-baseline justify-between py-2.5 text-left"
      style={{ borderBottom: "1px solid #E7EEDB" }}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] text-stone-800 truncate">{label}</div>
        {sub && <div className="text-[11.5px] text-stone-400">{sub}</div>}
      </div>
      <div
        className="text-[13.5px] tabular-nums flex-shrink-0 pl-2"
        style={{ color: valueColor || PRIMARY, fontWeight: 600 }}
      >
        {value}
      </div>
    </button>
  );
}

function StatusDot({ status }) {
  return <Circle size={8} fill={STATUS_COLOR[status]} color={STATUS_COLOR[status]} />;
}

export default function MyHouseOS() {
  const [tab, setTab] = useState("home");
  const [slideDirection, setSlideDirection] = useState("right");
  const [systems, setSystems] = useState(seedSystems);
  const [tasks, setTasks] = useState(seedTasks);
  const [expenses, setExpenses] = useState(seedExpenses);
  const [documents, setDocuments] = useState(seedDocuments);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [addSheet, setAddSheet] = useState(null); // 'task' | 'expense' | 'system' | 'doc'
  const [editItem, setEditItem] = useState(null); // { kind: 'task' | 'expense' | 'system' | 'doc', item: object }
  const [profile, setProfile] = useState({ name: "Alex Carter", email: "alex@example.com", address: "123 Main St, Atlanta, GA" });
  const [editingProfile, setEditingProfile] = useState(false);

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

  const forecast = useMemo(() => {
    const years = [2026, 2027, 2028, 2029, 2030];
    return years.map((y) => {
      const replacing = systems.filter((s) => replacementYear(s) === y);
      const base = y === TODAY.getFullYear() ? spentThisYear : 550;
      const big = replacing.reduce((s, sys) => s + sys.replacementCost, 0);
      return { year: y, amount: base + big, systems: replacing };
    });
  }, [systems, spentThisYear]);

  const next12mo = forecast[0].amount * 0.4 + (forecast[1] ? forecast[1].amount * 0.6 : 0);
  const monthlyReserve = Math.round(
    forecast.reduce((s, f) => s + f.amount, 0) / (forecast.length * 12)
  );

  function goToTab(next) {
    setSlideDirection(TAB_ORDER.indexOf(next) >= TAB_ORDER.indexOf(tab) ? "right" : "left");
    setTab(next);
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
    setAddSheet(null);
  }

  function updateTask(id, patch) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setEditItem(null);
  }

  function deleteTask(id) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    setEditItem(null);
  }

  function addExpense(amount, category, note, systemId) {
    setExpenses((es) => [
      ...es,
      { id: "e" + Date.now(), systemId, amount, category, note, date: TODAY.toISOString().slice(0, 10) },
    ]);
    setAddSheet(null);
  }

  function updateExpense(id, patch) {
    setExpenses((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setEditItem(null);
  }

  function deleteExpense(id) {
    setExpenses((es) => es.filter((e) => e.id !== id));
    setEditItem(null);
  }

  function addDocument(label, type, systemId) {
    setDocuments((ds) => [...ds, { id: "d" + Date.now(), label, type, systemId }]);
    setAddSheet(null);
  }

  function updateDocument(id, patch) {
    setDocuments((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    setEditItem(null);
  }

  function deleteDocument(id) {
    setDocuments((ds) => ds.filter((d) => d.id !== id));
    setEditItem(null);
  }

  function addSystem(sys) {
    setSystems((ss) => [...ss, { id: "sys" + Date.now(), ...sys }]);
    setAddSheet(null);
  }

  function updateSystem(id, patch) {
    setSystems((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSelectedSystem((cur) => (cur && cur.id === id ? { ...cur, ...patch } : cur));
    setEditItem(null);
  }

  function deleteSystem(id) {
    setSystems((ss) => ss.filter((s) => s.id !== id));
    setSelectedSystem(null);
    setEditItem(null);
  }

  function saveProfile(next) {
    setProfile(next);
    setEditingProfile(false);
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
        <div key={tab} className={slideDirection === "right" ? "tab-slide-right" : "tab-slide-left"}>
          {editItem ? (
            <EditScreen
              kind={editItem.kind}
              item={editItem.item}
              systems={systems}
              onBack={() => setEditItem(null)}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onUpdateDocument={updateDocument}
              onDeleteDocument={deleteDocument}
              onUpdateSystem={updateSystem}
              onDeleteSystem={deleteSystem}
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
              {tab === "systems" && !selectedSystem && (
                <SystemsScreen
                  systems={systems}
                  tasks={tasks}
                  onSelect={setSelectedSystem}
                  onAdd={() => setAddSheet("system")}
                />
              )}
              {tab === "systems" && selectedSystem && (
                <SystemDetail
                  sys={selectedSystem}
                  tasks={tasks.filter((t) => t.systemId === selectedSystem.id)}
                  documents={documents.filter((d) => d.systemId === selectedSystem.id)}
                  onBack={() => setSelectedSystem(null)}
                  onEdit={() => setEditItem({ kind: "system", item: selectedSystem })}
                />
              )}
              {tab === "tasks" && (
                <TasksScreen
                  tasks={upcomingTasks}
                  completed={tasks.filter((t) => t.completed)}
                  systemById={systemById}
                  onToggle={toggleTask}
                  onEdit={(t) => setEditItem({ kind: "task", item: t })}
                  onAdd={() => setAddSheet("task")}
                />
              )}
              {tab === "costs" && (
                <CostsScreen
                  expenses={expenses}
                  forecast={forecast}
                  systemById={systemById}
                  onEdit={(e) => setEditItem({ kind: "expense", item: e })}
                  onAdd={() => setAddSheet("expense")}
                />
              )}
              {tab === "docs" && (
                <DocsScreen
                  documents={documents}
                  systemById={systemById}
                  onEdit={(d) => setEditItem({ kind: "doc", item: d })}
                  onAdd={() => setAddSheet("doc")}
                />
              )}
              {tab === "account" && (
                <AccountScreen profile={profile} onEdit={() => setEditingProfile(true)} />
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
        }}
      />

      {addSheet && (
        <AddSheet
          kind={addSheet}
          systems={systems}
          onClose={() => setAddSheet(null)}
          onAddTask={addTask}
          onAddExpense={addExpense}
          onAddDocument={addDocument}
          onAddSystem={addSystem}
        />
      )}

      {editingProfile && (
        <EditProfileSheet
          profile={profile}
          onClose={() => setEditingProfile(false)}
          onSave={saveProfile}
        />
      )}
    </div>
  );
}

function HomeHero({ todoCount, overdueCount, systemsCount, profile, onOpenAccount, onNavigate }) {
  const greeting = overdueCount > 0 ? "Your home needs\nsome attention" : "Your home is in\ngreat shape";
  return (
    <div
      className="-mx-4 -mt-5 mb-5 px-5 pt-5 pb-4"
      style={{ background: `linear-gradient(180deg, ${HERO_BG_TOP} 0%, ${HERO_BG_BOTTOM} 100%)`, borderRadius: "0 0 28px 28px" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-lg p-1.5" style={{ background: "rgba(255,255,255,0.55)" }}>
          <LayoutGrid size={18} color={PRIMARY} />
        </div>
        <button
          onClick={onOpenAccount}
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32, background: PRIMARY, color: "white", fontSize: 13, fontWeight: 700 }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </button>
      </div>

      <div className="text-center mb-4">
        {greeting.split("\n").map((line) => (
          <div key={line} className="text-[22px] font-bold leading-snug" style={{ color: PRIMARY }}>
            {line}
          </div>
        ))}
      </div>

      <div className="flex justify-center mb-4">
        <button
          className="flex items-center gap-2 bg-white rounded-full px-4 py-2 text-[13.5px] font-semibold"
          style={{ color: PRIMARY, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          Ask Anything
          <span
            className="flex-shrink-0"
            style={{ width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #FDE68A, #F472B6 60%, #818CF8)" }}
          />
        </button>
      </div>

      <div className="rounded-2xl bg-white flex" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
        {[
          { label: "To-do", value: todoCount, tab: "tasks" },
          { label: "Overdue", value: overdueCount, tab: "tasks" },
          { label: "Systems", value: systemsCount, tab: "systems" },
        ].map((s, i) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.tab)}
            className="flex-1 text-center py-3"
            style={{ borderRight: i < 2 ? "1px solid #F0F0EA" : "none" }}
          >
            <div className="text-[18px] font-bold" style={{ color: PRIMARY }}>{s.value}</div>
            <div className="text-[11px] text-stone-500">{s.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TodayList({ tasks, systemById, onStart }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[15px] font-bold text-stone-900">Today</div>
        <div className="text-[13px] text-stone-400">{tasks.length}</div>
      </div>
      {tasks.length === 0 && (
        <div className="rounded-xl bg-white px-3 py-3 text-[13px] text-stone-400" style={{ border: "1px solid #E0E8D3" }}>
          Nothing needs attention right now.
        </div>
      )}
      <div className="flex flex-col gap-2">
        {tasks.map((t, i) => {
          const sys = systemById(t.systemId);
          const days = daysUntil(t.dueDate);
          const barColor = days < 0 ? STATUS_COLOR.red : i === 1 ? "#7FB7B0" : "#D8D5CB";
          return (
            <div key={t.id} className="rounded-xl bg-white flex items-stretch overflow-hidden" style={{ border: "1px solid #E0E8D3" }}>
              <div style={{ width: 4, background: barColor }} />
              <div className="flex-1 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-stone-900 truncate">{t.title}</div>
                    {sys && <div className="text-[12px] text-stone-400">{sys.name}</div>}
                  </div>
                  {i === 0 && (
                    <button
                      onClick={() => onStart(t)}
                      className="rounded-full px-4 py-1.5 text-[12.5px] font-semibold text-white flex-shrink-0"
                      style={{ background: PRIMARY }}
                    >
                      Start
                    </button>
                  )}
                </div>
                {(t.duration || t.difficulty) && (
                  <div
                    className="flex items-center gap-2 mt-2 pt-2 text-[12px] text-stone-500"
                    style={{ borderTop: "1px dashed #E7EEDB" }}
                  >
                    {t.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {t.duration}
                      </span>
                    )}
                    {t.duration && t.difficulty && <span className="text-stone-300">|</span>}
                    {t.difficulty && <span>{t.difficulty}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecommendedList({ items }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[15px] font-bold text-stone-900">Recommended for you</div>
        <div className="text-[13px] text-stone-400">{items.length}</div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((r) => (
          <div
            key={r.id}
            className="rounded-xl p-3 flex-shrink-0"
            style={{ width: 190, background: r.highlight ? ACCENT_YELLOW : "white", border: r.highlight ? "none" : "1px solid #E0E8D3" }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="text-[13.5px] font-bold text-stone-900">{r.title}</div>
            </div>
            <div className="text-[12px] text-stone-600 mb-2">{r.subtitle}</div>
            {r.cta && (
              <button className="rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ background: "white", color: PRIMARY }}>
                {r.cta}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeScreen({ upcomingTasks, systemById, systems, tasks, spentThisYear, next12mo, monthlyReserve, profile, onOpenSystem, onOpenAccount, onNavigate }) {
  const overdueCount = tasks.filter((t) => !t.completed && daysUntil(t.dueDate) < 0).length;
  return (
    <div>
      <HomeHero
        todoCount={upcomingTasks.length}
        overdueCount={overdueCount}
        systemsCount={systems.length}
        profile={profile}
        onOpenAccount={onOpenAccount}
        onNavigate={onNavigate}
      />

      <TodayList tasks={upcomingTasks.slice(0, 3)} systemById={systemById} onStart={() => {}} />

      <RecommendedList items={seedRecommendations} />

      <div className="mb-5">
        <div className="text-[12px] font-semibold text-stone-500 mb-1">Financial outlook</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white p-3" style={{ border: "1px solid #E0E8D3" }}>
            <div className="text-[11px] text-stone-400">Spent this year</div>
            <div className="text-[18px] font-semibold tabular-nums text-stone-900">{money(spentThisYear)}</div>
          </div>
          <div className="rounded-xl bg-white p-3" style={{ border: "1px solid #E0E8D3" }}>
            <div className="text-[11px] text-stone-400">Next 12 months</div>
            <div className="text-[18px] font-semibold tabular-nums text-stone-900">{money(Math.round(next12mo))}</div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-3 mt-2" style={{ border: "1px solid #E0E8D3" }}>
          <div className="text-[11px] text-stone-400">Recommended monthly reserve</div>
          <div className="text-[18px] font-semibold tabular-nums text-stone-900">{money(monthlyReserve)}/mo</div>
        </div>
      </div>

      <div>
        <div className="text-[12px] font-semibold text-stone-500 mb-1">Home health</div>
        <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
          {systems.map((s) => {
            const status = systemStatus(s, tasks);
            const meta = CATEGORY_META[s.category];
            const Icon = meta.icon;
            return (
              <button
                key={s.id}
                onClick={() => onOpenSystem(s)}
                className="w-full flex items-center justify-between py-2.5"
                style={{ borderBottom: "1px solid #E7EEDB" }}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} color="#5F5B50" />
                  <span className="text-[13.5px] text-stone-800">{meta.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status={status} />
                  <ChevronRight size={15} color="#B8B4A8" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SystemsScreen({ systems, tasks, onSelect, onAdd }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Systems</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>
      <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
        {systems.map((s) => {
          const meta = CATEGORY_META[s.category];
          const Icon = meta.icon;
          const status = systemStatus(s, tasks);
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full flex items-center justify-between py-3"
              style={{ borderBottom: "1px solid #E7EEDB" }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ background: "#F5F8F0" }}>
                  <Icon size={17} color="#5F5B50" />
                </div>
                <div className="text-left">
                  <div className="text-[13.5px] text-stone-800">{s.name}</div>
                  <div className="text-[11.5px] text-stone-400">{meta.label} · {s.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={status} />
                <ChevronRight size={15} color="#B8B4A8" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SystemDetail({ sys, tasks, documents, onBack, onEdit }) {
  const meta = CATEGORY_META[sys.category];
  const Icon = meta.icon;
  const repYear = replacementYear(sys);
  const monthsOut = Math.max(1, (repYear - TODAY.getFullYear()) * 12 - TODAY.getMonth());
  const reserve = Math.round(sys.replacementCost / monthsOut);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-stone-500">
          <ChevronLeft size={16} /> Systems
        </button>
        <button onClick={onEdit} className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: PRIMARY }}>
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg p-2.5" style={{ background: "#F5F8F0" }}>
          <Icon size={20} color="#5F5B50" />
        </div>
        <div>
          <div className="text-[17px] font-semibold text-stone-900">{sys.name}</div>
          <div className="text-[12px] text-stone-400">{meta.label} · {sys.location}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        <LedgerRow label="Installed" value={new Date(sys.purchaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} />
        <LedgerRow label="Purchase price" value={money(sys.purchasePrice)} />
        <LedgerRow label="Expected life" value={`${sys.expectedLifeYears} years`} />
        <LedgerRow label="Est. replacement" value={`${money(sys.replacementCost)}, ${repYear}`} />
        <LedgerRow
          label="Warranty"
          value={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? "Active" : "Expired"}
          valueColor={sys.warrantyExpiration && new Date(sys.warrantyExpiration) > TODAY ? STATUS_COLOR.green : STATUS_COLOR.red}
        />
      </div>

      <div className="rounded-xl p-3 mb-4" style={{ background: STATUS_BG.yellow, border: "1px solid #F0DDB3" }}>
        <div className="text-[11px]" style={{ color: STATUS_COLOR.yellow, fontWeight: 600 }}>Recommended savings</div>
        <div className="text-[15px] tabular-nums" style={{ color: STATUS_COLOR.yellow, fontWeight: 600 }}>{money(reserve)}/mo toward replacement</div>
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Upcoming tasks</div>
      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        {tasks.length === 0 && <div className="py-3 text-[13px] text-stone-400">No tasks scheduled.</div>}
        {tasks.map((t) => (
          <LedgerRow key={t.id} label={t.title} value={new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        ))}
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Documents</div>
      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        {documents.length === 0 && <div className="py-3 text-[13px] text-stone-400">No documents attached.</div>}
        {documents.map((d) => (
          <LedgerRow key={d.id} label={d.label} sub={d.type} value="" />
        ))}
      </div>
    </div>
  );
}

function TasksScreen({ tasks, completed, systemById, onToggle, onEdit, onAdd }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Tasks</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>
      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        {tasks.map((t) => {
          const sys = systemById(t.systemId);
          const days = daysUntil(t.dueDate);
          return (
            <div key={t.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid #E7EEDB" }}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button onClick={() => onToggle(t.id)} aria-label="Toggle complete" className="flex-shrink-0">
                  <div
                    className="rounded-full"
                    style={{ width: 18, height: 18, border: "1.5px solid #C9C5B8" }}
                  />
                </button>
                <button onClick={() => onEdit(t)} className="text-left min-w-0">
                  <div className="text-[13.5px] text-stone-800 truncate">{t.title}</div>
                  <div className="text-[11.5px] text-stone-400">{sys ? sys.name : "General"}</div>
                </button>
              </div>
              <div
                className="text-[12px] tabular-nums flex-shrink-0 pl-2"
                style={{ color: days < 0 ? STATUS_COLOR.red : days <= 14 ? STATUS_COLOR.yellow : "#9C978C" }}
              >
                {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && <div className="py-3 text-[13px] text-stone-400">No open tasks.</div>}
      </div>

      {completed.length > 0 && (
        <>
          <div className="text-[12px] font-semibold text-stone-500 mb-1">Completed</div>
          <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
            {completed.map((t) => (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                className="flex items-center gap-2.5 py-2.5 text-left w-full"
                style={{ borderBottom: "1px solid #E7EEDB" }}
              >
                <Check size={15} color={STATUS_COLOR.green} />
                <span className="text-[13px] text-stone-400 line-through">{t.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CostsScreen({ expenses, forecast, systemById, onEdit, onAdd }) {
  const maxAmt = Math.max(...forecast.map((f) => f.amount), 1);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Costs</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">5-year forecast</div>
      <div className="rounded-xl bg-white p-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        {forecast.map((f) => (
          <div key={f.year} className="flex items-center gap-2 mb-2">
            <div className="text-[12px] w-9 text-stone-500">{f.year}</div>
            <div className="flex-1 rounded" style={{ background: "#EFEDE6", height: 16 }}>
              <div
                className="h-full rounded"
                style={{ width: `${Math.max(6, (f.amount / maxAmt) * 100)}%`, background: PRIMARY }}
              />
            </div>
            <div className="text-[12px] tabular-nums w-16 text-right text-stone-800">{money(f.amount)}</div>
          </div>
        ))}
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Expense log</div>
      <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
        {expenses
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((e) => {
            const sys = systemById(e.systemId);
            return (
              <LedgerRow
                key={e.id}
                label={e.note}
                sub={`${e.category}${sys ? " · " + sys.name : ""} · ${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                value={money(e.amount)}
                onClick={() => onEdit(e)}
              />
            );
          })}
      </div>
    </div>
  );
}

function DocsScreen({ documents, systemById, onEdit, onAdd }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Documents</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>
      <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
        {documents.map((d) => {
          const sys = systemById(d.systemId);
          return (
            <button
              key={d.id}
              onClick={() => onEdit(d)}
              className="w-full flex items-center gap-3 py-2.5 text-left"
              style={{ borderBottom: "1px solid #E7EEDB" }}
            >
              <FileText size={17} color="#5F5B50" />
              <div>
                <div className="text-[13.5px] text-stone-800">{d.label}</div>
                <div className="text-[11.5px] text-stone-400">{d.type}{sys ? " · " + sys.name : ""}</div>
              </div>
            </button>
          );
        })}
        {documents.length === 0 && <div className="py-3 text-[13px] text-stone-400">No documents yet.</div>}
      </div>
    </div>
  );
}

function AccountScreen({ profile, onEdit }) {
  return (
    <div>
      <div className="text-[17px] font-semibold text-stone-900 mb-4">Account</div>

      <div className="flex flex-col items-center mb-5">
        <div
          className="rounded-full flex items-center justify-center mb-2"
          style={{ width: 64, height: 64, background: PRIMARY, color: "white", fontSize: 24, fontWeight: 700 }}
        >
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-[15px] font-semibold text-stone-900">{profile.name}</div>
        <div className="text-[12.5px] text-stone-400">{profile.email}</div>
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Home</div>
      <div className="rounded-xl bg-white px-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        <LedgerRow label="Address" value={profile.address} />
        <LedgerRow label="Plan" value="Free" />
      </div>

      <button
        onClick={onEdit}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold mb-2"
        style={{ background: PRIMARY, color: "white" }}
      >
        Edit profile
      </button>
      <button
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ border: "1px solid #E0E8D3", color: STATUS_COLOR.red }}
      >
        Sign out
      </button>
    </div>
  );
}

function EditProfileSheet({ profile, onClose, onSave }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    onSave({ name: name.trim(), email: email.trim(), address: address.trim() });
  }

  return (
    <div
      className="flex items-end"
      style={{ position: "absolute", inset: 0, background: "rgba(22,36,15,0.35)", borderRadius: 28 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white p-4"
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "1px solid #E0E8D3" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold text-stone-900">Edit profile</div>
          <button onClick={onClose}>
            <X size={18} color="#9C978C" />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Home address"
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />

        {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
          style={{ background: PRIMARY, color: "white" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

const KIND_NOUNS = { task: "task", expense: "expense", system: "system", doc: "document" };

function ItemFields({
  kind, systems,
  title, setTitle,
  dueDate, setDueDate,
  amount, setAmount,
  category, setCategory,
  systemId, setSystemId,
  docType, setDocType,
  sysName, setSysName,
  sysCategory, setSysCategory,
  sysLocation, setSysLocation,
  sysPurchaseDate, setSysPurchaseDate,
  sysPurchasePrice, setSysPurchasePrice,
  sysLifeYears, setSysLifeYears,
  sysReplacementCost, setSysReplacementCost,
  sysWarranty, setSysWarranty,
}) {
  return (
    <>
      {(kind === "task" || kind === "doc") && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "task" ? "e.g. Replace air filter" : "e.g. Water heater receipt"}
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
      )}

      {kind === "task" && (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
      )}

      {kind === "expense" && (
        <>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note (e.g. Gutter cleaning)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            <option>Maintenance</option>
            <option>Repair</option>
            <option>Replacement</option>
            <option>Inspection</option>
          </select>
        </>
      )}

      {kind === "doc" && (
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        >
          <option>Receipt</option>
          <option>Warranty</option>
          <option>Invoice</option>
          <option>Manual</option>
        </select>
      )}

      {(kind === "task" || kind === "expense" || kind === "doc") && (
        <select
          value={systemId}
          onChange={(e) => setSystemId(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        >
          <option value="">General (no system)</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {kind === "system" && (
        <>
          <input
            value={sysName}
            onChange={(e) => setSysName(e.target.value)}
            placeholder="Name (e.g. Carrier Infinity)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <select
            value={sysCategory}
            onChange={(e) => setSysCategory(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <input
            value={sysLocation}
            onChange={(e) => setSysLocation(e.target.value)}
            placeholder="Location (e.g. Attic, Garage, Kitchen)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <div className="text-[11px] text-stone-500 mb-1">Purchase date</div>
          <input
            type="date"
            value={sysPurchaseDate}
            onChange={(e) => setSysPurchaseDate(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <input
            value={sysPurchasePrice}
            onChange={(e) => setSysPurchasePrice(e.target.value)}
            placeholder="Purchase price ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={sysLifeYears}
            onChange={(e) => setSysLifeYears(e.target.value)}
            placeholder="Expected life (years)"
            inputMode="numeric"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={sysReplacementCost}
            onChange={(e) => setSysReplacementCost(e.target.value)}
            placeholder="Estimated replacement cost ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <div className="text-[11px] text-stone-500 mb-1">Warranty expiration (optional)</div>
          <input
            type="date"
            value={sysWarranty}
            onChange={(e) => setSysWarranty(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
        </>
      )}
    </>
  );
}

function AddSheet({ kind, systems, onClose, onAddTask, onAddExpense, onAddDocument, onAddSystem }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("2026-10-01");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [systemId, setSystemId] = useState(systems[0]?.id || "");
  const [docType, setDocType] = useState("Receipt");

  const [sysName, setSysName] = useState("");
  const [sysCategory, setSysCategory] = useState(Object.keys(CATEGORY_META)[0]);
  const [sysLocation, setSysLocation] = useState("");
  const [sysPurchaseDate, setSysPurchaseDate] = useState("2026-01-01");
  const [sysPurchasePrice, setSysPurchasePrice] = useState("");
  const [sysLifeYears, setSysLifeYears] = useState("10");
  const [sysReplacementCost, setSysReplacementCost] = useState("");
  const [sysWarranty, setSysWarranty] = useState("");

  const [error, setError] = useState("");

  const titles = { task: "Add task", expense: "Add expense", system: "Add system", doc: "Add document" };

  function handleSubmit() {
    const finalSystemId = systemId || null;
    if (kind === "task") {
      if (!title.trim()) return setError("Enter a task name.");
      onAddTask(title.trim(), dueDate, finalSystemId);
    } else if (kind === "expense") {
      const num = parseFloat(amount);
      if (!amount || isNaN(num) || num <= 0) return setError("Enter an amount.");
      onAddExpense(num, category, title.trim() || category, finalSystemId);
    } else if (kind === "doc") {
      if (!title.trim()) return setError("Enter a document label.");
      onAddDocument(title.trim(), docType, finalSystemId);
    } else if (kind === "system") {
      if (!sysName.trim()) return setError("Enter a system name.");
      if (!sysLocation.trim()) return setError("Enter a location.");
      const price = parseFloat(sysPurchasePrice);
      if (!sysPurchasePrice || isNaN(price) || price < 0) return setError("Enter a valid purchase price.");
      const life = parseInt(sysLifeYears, 10);
      if (!sysLifeYears || isNaN(life) || life <= 0) return setError("Enter a valid expected life, in years.");
      const replCost = parseFloat(sysReplacementCost);
      if (!sysReplacementCost || isNaN(replCost) || replCost < 0) return setError("Enter a valid replacement cost.");

      onAddSystem({
        name: sysName.trim(),
        category: sysCategory,
        location: sysLocation.trim(),
        purchaseDate: sysPurchaseDate,
        purchasePrice: price,
        expectedLifeYears: life,
        replacementCost: replCost,
        warrantyExpiration: sysWarranty,
      });
    }
  }

  return (
    <div
      className="flex items-end"
      style={{ position: "absolute", inset: 0, background: "rgba(22,36,15,0.35)", borderRadius: 28 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white p-4"
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, border: "1px solid #E0E8D3", maxHeight: 520, overflowY: "auto" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-semibold text-stone-900">{titles[kind]}</div>
          <button onClick={onClose}>
            <X size={18} color="#9C978C" />
          </button>
        </div>

        <ItemFields
          kind={kind} systems={systems}
          title={title} setTitle={setTitle}
          dueDate={dueDate} setDueDate={setDueDate}
          amount={amount} setAmount={setAmount}
          category={category} setCategory={setCategory}
          systemId={systemId} setSystemId={setSystemId}
          docType={docType} setDocType={setDocType}
          sysName={sysName} setSysName={setSysName}
          sysCategory={sysCategory} setSysCategory={setSysCategory}
          sysLocation={sysLocation} setSysLocation={setSysLocation}
          sysPurchaseDate={sysPurchaseDate} setSysPurchaseDate={setSysPurchaseDate}
          sysPurchasePrice={sysPurchasePrice} setSysPurchasePrice={setSysPurchasePrice}
          sysLifeYears={sysLifeYears} setSysLifeYears={setSysLifeYears}
          sysReplacementCost={sysReplacementCost} setSysReplacementCost={setSysReplacementCost}
          sysWarranty={sysWarranty} setSysWarranty={setSysWarranty}
        />

        {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
          style={{ background: PRIMARY, color: "white" }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function EditScreen({
  kind, item, systems, onBack,
  onUpdateTask, onDeleteTask,
  onUpdateExpense, onDeleteExpense,
  onUpdateDocument, onDeleteDocument,
  onUpdateSystem, onDeleteSystem,
}) {
  const [title, setTitle] = useState(kind === "expense" ? item.note || "" : item.title || item.label || "");
  const [dueDate, setDueDate] = useState(item.dueDate || "2026-10-01");
  const [amount, setAmount] = useState(item.amount != null ? String(item.amount) : "");
  const [category, setCategory] = useState(item.category || "Maintenance");
  const [systemId, setSystemId] = useState(item.systemId || "");
  const [docType, setDocType] = useState(item.type || "Receipt");

  const [sysName, setSysName] = useState(item.name || "");
  const [sysCategory, setSysCategory] = useState(item.category || Object.keys(CATEGORY_META)[0]);
  const [sysLocation, setSysLocation] = useState(item.location || "");
  const [sysPurchaseDate, setSysPurchaseDate] = useState(item.purchaseDate || "2026-01-01");
  const [sysPurchasePrice, setSysPurchasePrice] = useState(item.purchasePrice != null ? String(item.purchasePrice) : "");
  const [sysLifeYears, setSysLifeYears] = useState(item.expectedLifeYears != null ? String(item.expectedLifeYears) : "10");
  const [sysReplacementCost, setSysReplacementCost] = useState(item.replacementCost != null ? String(item.replacementCost) : "");
  const [sysWarranty, setSysWarranty] = useState(item.warrantyExpiration || "");

  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titles = { task: "Edit task", expense: "Edit expense", system: "Edit system", doc: "Edit document" };
  const backLabels = { task: "Tasks", expense: "Costs", doc: "Docs", system: item.name };

  function handleSubmit() {
    const finalSystemId = systemId || null;
    if (kind === "task") {
      if (!title.trim()) return setError("Enter a task name.");
      onUpdateTask(item.id, { title: title.trim(), dueDate, systemId: finalSystemId });
    } else if (kind === "expense") {
      const num = parseFloat(amount);
      if (!amount || isNaN(num) || num <= 0) return setError("Enter an amount.");
      onUpdateExpense(item.id, { amount: num, category, note: title.trim() || category, systemId: finalSystemId });
    } else if (kind === "doc") {
      if (!title.trim()) return setError("Enter a document label.");
      onUpdateDocument(item.id, { label: title.trim(), type: docType, systemId: finalSystemId });
    } else if (kind === "system") {
      if (!sysName.trim()) return setError("Enter a system name.");
      if (!sysLocation.trim()) return setError("Enter a location.");
      const price = parseFloat(sysPurchasePrice);
      if (!sysPurchasePrice || isNaN(price) || price < 0) return setError("Enter a valid purchase price.");
      const life = parseInt(sysLifeYears, 10);
      if (!sysLifeYears || isNaN(life) || life <= 0) return setError("Enter a valid expected life, in years.");
      const replCost = parseFloat(sysReplacementCost);
      if (!sysReplacementCost || isNaN(replCost) || replCost < 0) return setError("Enter a valid replacement cost.");

      onUpdateSystem(item.id, {
        name: sysName.trim(),
        category: sysCategory,
        location: sysLocation.trim(),
        purchaseDate: sysPurchaseDate,
        purchasePrice: price,
        expectedLifeYears: life,
        replacementCost: replCost,
        warrantyExpiration: sysWarranty,
      });
    }
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (kind === "task") onDeleteTask(item.id);
    else if (kind === "expense") onDeleteExpense(item.id);
    else if (kind === "doc") onDeleteDocument(item.id);
    else if (kind === "system") onDeleteSystem(item.id);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-3 text-[13px] text-stone-500">
        <ChevronLeft size={16} /> {backLabels[kind]}
      </button>

      <div className="text-[17px] font-semibold text-stone-900 mb-4">{titles[kind]}</div>

      <ItemFields
        kind={kind} systems={systems}
        title={title} setTitle={setTitle}
        dueDate={dueDate} setDueDate={setDueDate}
        amount={amount} setAmount={setAmount}
        category={category} setCategory={setCategory}
        systemId={systemId} setSystemId={setSystemId}
        docType={docType} setDocType={setDocType}
        sysName={sysName} setSysName={setSysName}
        sysCategory={sysCategory} setSysCategory={setSysCategory}
        sysLocation={sysLocation} setSysLocation={setSysLocation}
        sysPurchaseDate={sysPurchaseDate} setSysPurchaseDate={setSysPurchaseDate}
        sysPurchasePrice={sysPurchasePrice} setSysPurchasePrice={setSysPurchasePrice}
        sysLifeYears={sysLifeYears} setSysLifeYears={setSysLifeYears}
        sysReplacementCost={sysReplacementCost} setSysReplacementCost={setSysReplacementCost}
        sysWarranty={sysWarranty} setSysWarranty={setSysWarranty}
      />

      {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

      <button
        onClick={handleSubmit}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ background: PRIMARY, color: "white" }}
      >
        Save changes
      </button>

      <button
        onClick={handleDelete}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold mt-2"
        style={{
          border: "1px solid #F0C9C9",
          color: STATUS_COLOR.red,
          background: confirmingDelete ? STATUS_BG.red : "white",
        }}
      >
        {confirmingDelete ? "Tap again to delete" : `Delete ${KIND_NOUNS[kind]}`}
      </button>
    </div>
  );
}
