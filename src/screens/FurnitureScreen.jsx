import { Plus, Sofa } from "lucide-react";
import { PRIMARY, ROOMS } from "../lib/constants.js";
import { money } from "../lib/forecast.js";

export default function FurnitureScreen({ furniture, onEdit, onAdd }) {
  const totalValue = furniture.reduce((s, f) => s + f.value, 0);
  const roomsInUse = ROOMS.filter((r) => furniture.some((f) => f.room === r));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[17px] font-semibold text-stone-900">Furniture</div>
        <button onClick={onAdd} className="rounded-full p-1.5" style={{ background: PRIMARY }}>
          <Plus size={16} color="white" />
        </button>
      </div>

      <div className="rounded-xl bg-white p-3 mb-4" style={{ border: "1px solid #E0E8D3" }}>
        <div className="text-[11px] text-stone-400">Total insured value</div>
        <div className="text-[18px] font-semibold tabular-nums text-stone-900">{money(totalValue)}</div>
      </div>

      {furniture.length === 0 && (
        <div className="rounded-xl bg-white px-3 py-3 text-[13px] text-stone-400" style={{ border: "1px solid #E0E8D3" }}>
          No furniture logged yet. Snap a photo of each room to get started.
        </div>
      )}

      {roomsInUse.map((room) => (
        <div key={room} className="mb-4">
          <div className="text-[12px] font-semibold text-stone-500 mb-1">{room}</div>
          <div className="rounded-xl bg-white px-3" style={{ border: "1px solid #E0E8D3" }}>
            {furniture
              .filter((f) => f.room === room)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => onEdit(f)}
                  className="w-full flex items-center gap-3 py-2.5 text-left"
                  style={{ borderBottom: "1px solid #E7EEDB" }}
                >
                  {f.photoUrl ? (
                    <img
                      src={f.photoUrl}
                      alt=""
                      className="rounded-lg object-cover flex-shrink-0"
                      style={{ width: 34, height: 34, border: "1px solid #E0E8D3" }}
                    />
                  ) : (
                    <Sofa size={17} color="#5F5B50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] text-stone-800 truncate">{f.name}</div>
                    {f.note && <div className="text-[11.5px] text-stone-400 truncate">{f.note}</div>}
                  </div>
                  <div className="text-[13px] tabular-nums text-stone-800 flex-shrink-0">{money(f.value)}</div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
