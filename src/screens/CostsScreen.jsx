import { Plus } from "lucide-react";
import { PRIMARY } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.jsx";

export default function CostsScreen({ expenses, forecast, systemById, onEdit, onAdd }) {
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
                sub={`${e.category}${sys ? " · " + sys.brand + " " + sys.model : ""} · ${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                value={money(e.amount)}
                onClick={() => onEdit(e)}
              />
            );
          })}
      </div>
    </div>
  );
}
