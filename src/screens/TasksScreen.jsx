import { Plus, Check } from "lucide-react";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { daysUntil } from "../lib/forecast.js";

export default function TasksScreen({ tasks, completed, systemById, onToggle, onEdit, onAdd }) {
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
                  <div className="text-[11.5px] text-stone-400">{sys ? `${sys.brand} ${sys.model}` : "General"}</div>
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
