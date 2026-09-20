import { Plus, ChevronRight } from "lucide-react";
import { PRIMARY, CATEGORY_META, FREE_SYSTEM_LIMIT } from "../lib/constants.js";
import { systemStatus } from "../lib/forecast.js";
import StatusDot from "../components/StatusDot.jsx";

export default function SystemsScreen({ systems, tasks, onSelect, onAdd, atLimit }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Systems</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>

      {atLimit && (
        <div className="rounded-xl px-3 py-2 mb-3 text-[12px]" style={{ background: "#FAEEDA", color: "#8A5A0F" }}>
          Free plan limit reached ({FREE_SYSTEM_LIMIT} systems). Tap + to upgrade for unlimited systems.
        </div>
      )}
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
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt=""
                    className="rounded-lg object-cover flex-shrink-0"
                    style={{ width: 34, height: 34, border: "1px solid #E0E8D3" }}
                  />
                ) : (
                  <div className="rounded-lg p-2" style={{ background: "#F5F8F0" }}>
                    <Icon size={17} color="#5F5B50" />
                  </div>
                )}
                <div className="text-left">
                  <div className="text-[13.5px] text-stone-800">{s.brand} {s.model}</div>
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

      <div className="rounded-xl bg-white p-3 mt-3" style={{ border: "1px solid #E0E8D3" }}>
        <div className="text-[11px] text-stone-500 leading-relaxed">
          <span className="font-semibold text-stone-600">Tip:</span> Many home systems are actually made of multiple separate parts, each with its own age, price, and warranty. Log each part as its own system rather than combining them into one entry.
        </div>
        <div className="text-[11px] text-stone-500 leading-relaxed mt-2 pt-2" style={{ borderTop: "1px dashed #E7EEDB" }}>
          <span className="font-semibold text-stone-600">Example:</span> Your HVAC isn't one system — the outdoor unit (the fan on your patio) and the indoor unit (coil and air handler, usually in a closet or attic) are two separate pieces, often installed at different times, with different warranties, and replaced independently.
        </div>
      </div>
    </div>
  );
}
