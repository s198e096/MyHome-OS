import { ChevronLeft, Pencil } from "lucide-react";
import { PRIMARY, CATEGORY_META, STATUS_COLOR, STATUS_BG } from "../lib/constants.js";
import { TODAY, money, replacementYear } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.jsx";

export default function SystemDetail({ sys, tasks, documents, onBack, onEdit }) {
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
          <div className="text-[17px] font-semibold text-stone-900">{sys.brand} {sys.model}</div>
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
