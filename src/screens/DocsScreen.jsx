import { Plus, FileText } from "lucide-react";
import { PRIMARY } from "../lib/constants.js";

export default function DocsScreen({ documents, systemById, onEdit, onAdd }) {
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
              {d.photoUrl ? (
                <img
                  src={d.photoUrl}
                  alt=""
                  className="rounded-lg object-cover flex-shrink-0"
                  style={{ width: 34, height: 34, border: "1px solid #E0E8D3" }}
                />
              ) : (
                <FileText size={17} color="#5F5B50" />
              )}
              <div>
                <div className="text-[13.5px] text-stone-800">{d.label}</div>
                <div className="text-[11.5px] text-stone-400">{d.type}{sys ? " · " + sys.brand + " " + sys.model : ""}</div>
              </div>
            </button>
          );
        })}
        {documents.length === 0 && <div className="py-3 text-[13px] text-stone-400">No documents yet.</div>}
      </div>
    </div>
  );
}
