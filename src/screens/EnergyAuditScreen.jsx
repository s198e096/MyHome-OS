import { ChevronLeft, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { computeAutoChecks, computeEnergyScore, FAIL_TASK_TITLES } from "../lib/energyAudit.js";

const STATUS_CYCLE = { unknown: "pass", pass: "fail", fail: "unknown" };

function StatusIcon({ status }) {
  if (status === "pass") return <CheckCircle2 size={18} color={STATUS_COLOR.green} />;
  if (status === "fail") return <XCircle size={18} color={STATUS_COLOR.red} />;
  return <HelpCircle size={18} color="#B8B4A8" />;
}

function FailTaskAction({ title, taskExists, onCreate }) {
  if (taskExists) {
    return <div className="text-[11px] mt-1.5" style={{ color: STATUS_COLOR.green }}>Task added: {title}</div>;
  }
  return (
    <button onClick={onCreate} className="text-[11px] font-semibold mt-1.5" style={{ color: PRIMARY }}>
      + Add task: {title}
    </button>
  );
}

export default function EnergyAuditScreen({ systems, energyChecks, tasks, onBack, onUpdateCheck, onCreateTask }) {
  const autoChecks = computeAutoChecks(systems);
  const { passed, total } = computeEnergyScore(autoChecks, energyChecks);
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  const hasTask = (title) => tasks.some((t) => t.title === title);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-3 text-[13px] text-stone-500">
        <ChevronLeft size={16} /> Home
      </button>

      <div className="text-[17px] font-semibold text-stone-900 mb-1">Energy audit</div>
      <div className="text-[12.5px] text-stone-400 mb-3">{passed} of {total} checks passed</div>

      <div className="rounded-full overflow-hidden mb-5" style={{ height: 8, background: "#EAF3DE" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PRIMARY }} />
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">From your systems</div>
      <div className="rounded-xl bg-white px-3 mb-5" style={{ border: "1px solid #E0E8D3" }}>
        {autoChecks.map((c, i) => (
          <div key={c.key} className="py-2.5" style={{ borderBottom: i < autoChecks.length - 1 ? "1px solid #E7EEDB" : "none" }}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[13.5px] text-stone-800">{c.label}</div>
                <div className="text-[11.5px] text-stone-400">{c.context}</div>
              </div>
              <StatusIcon status={c.status} />
            </div>
            {c.status === "fail" && (
              <FailTaskAction title={c.failTask} taskExists={hasTask(c.failTask)} onCreate={() => onCreateTask(c.failTask)} />
            )}
          </div>
        ))}
      </div>

      <div className="text-[12px] font-semibold text-stone-500 mb-1">Quick checklist</div>
      <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
        {energyChecks.map((c, i) => {
          const failTitle = FAIL_TASK_TITLES[c.key];
          return (
            <div key={c.id} className="py-2.5" style={{ borderBottom: i < energyChecks.length - 1 ? "1px solid #E7EEDB" : "none" }}>
              <button onClick={() => onUpdateCheck(c.id, STATUS_CYCLE[c.status])} className="w-full flex items-center justify-between gap-2 text-left">
                <div className="text-[13.5px] text-stone-800">{c.label}</div>
                <StatusIcon status={c.status} />
              </button>
              {c.status === "fail" && (
                <FailTaskAction title={failTitle} taskExists={hasTask(failTitle)} onCreate={() => onCreateTask(failTitle)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
