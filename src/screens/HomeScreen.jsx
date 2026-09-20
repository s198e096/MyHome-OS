import { ChevronRight, Clock, Home, Zap } from "lucide-react";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META } from "../lib/constants.js";
import { daysUntil, money, systemStatus } from "../lib/forecast.js";
import { computeAutoChecks, computeEnergyScore } from "../lib/energyAudit.js";
import StatusDot from "../components/StatusDot.jsx";

const seedRecommendations = [
  { id: "r2", title: "Water Bill", subtitle: "Save $100 every month with a simple fix", cta: null, highlight: false },
  { id: "r3", title: "Filter Reminder", subtitle: "Set auto-reminders for HVAC filters", cta: null, highlight: false },
];

function HomeHero({ todoCount, overdueCount, systemsCount, profile, onOpenAccount, onNavigate }) {
  const greeting = overdueCount > 0 ? "Your home needs\nsome attention" : "Your home is in\ngreat shape";
  return (
    <div
      className="-mx-4 mb-5 px-5 pb-4"
      style={{
        background: `linear-gradient(180deg, ${HERO_BG_TOP} 0%, ${HERO_BG_BOTTOM} 100%)`,
        borderRadius: "0 0 28px 28px",
        marginTop: "calc(-1.25rem - env(safe-area-inset-top))",
        paddingTop: "calc(1.25rem + env(safe-area-inset-top))",
      }}
    >
      <div className="flex items-center justify-end mb-3">
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
                    {sys && <div className="text-[12px] text-stone-400">{sys.brand} {sys.model}</div>}
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
        {items.map((r) => {
          const Tag = r.onClick ? "button" : "div";
          const Icon = r.icon;
          return (
            <Tag
              key={r.id}
              onClick={r.onClick}
              className="rounded-xl p-3 flex-shrink-0 text-left"
              style={{ width: 190, background: r.highlight ? ACCENT_YELLOW : "white", border: r.highlight ? "none" : "1px solid #E0E8D3" }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[13.5px] font-bold text-stone-900">{r.title}</div>
                {Icon && <Icon size={15} color={PRIMARY} />}
              </div>
              <div className="text-[12px] text-stone-600 mb-2">{r.subtitle}</div>
              {r.cta && (
                <button className="rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ background: "white", color: PRIMARY }}>
                  {r.cta}
                </button>
              )}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeScreen({ upcomingTasks, systemById, systems, tasks, spentThisYear, next12mo, monthlyReserve, profile, energyChecks, onOpenSystem, onOpenAccount, onOpenEnergyAudit, onNavigate }) {
  const overdueCount = tasks.filter((t) => !t.completed && daysUntil(t.dueDate) < 0).length;

  const { passed: energyPassed, total: energyTotal } = computeEnergyScore(computeAutoChecks(systems), energyChecks);
  const recommendations = [
    {
      id: "energy-audit",
      title: "Energy audit",
      subtitle: `${energyPassed} of ${energyTotal} checks passed`,
      icon: Zap,
      highlight: true,
      onClick: onOpenEnergyAudit,
    },
    ...seedRecommendations,
  ];
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

      {profile.propertyValue != null && (
        <div className="rounded-xl bg-white p-3 mb-5" style={{ border: "1px solid #E0E8D3" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-400">Estimated property value</div>
              <div className="text-[20px] font-bold tabular-nums" style={{ color: PRIMARY }}>{money(profile.propertyValue)}</div>
              <div className="text-[11px] text-stone-400 truncate">{profile.address}</div>
            </div>
            <div className="rounded-lg p-2 flex-shrink-0" style={{ background: "#F5F8F0" }}>
              <Home size={20} color={PRIMARY} />
            </div>
          </div>
          {profile.propertyValueSource && (
            <div className="text-[10px] text-stone-400 mt-2 pt-2" style={{ borderTop: "1px dashed #E7EEDB" }}>
              Source: {profile.propertyValueSource}
            </div>
          )}
        </div>
      )}

      <TodayList tasks={upcomingTasks.slice(0, 3)} systemById={systemById} onStart={() => {}} />

      <RecommendedList items={recommendations} />

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
