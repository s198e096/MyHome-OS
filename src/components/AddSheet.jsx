import { useState } from "react";
import { X } from "lucide-react";
import { PRIMARY, STATUS_COLOR, CATEGORY_META } from "../lib/constants.js";
import ItemFields from "./ItemFields.jsx";

export default function AddSheet({ kind, systems, onClose, onAddTask, onAddExpense, onAddDocument, onAddSystem }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("2026-10-01");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [systemId, setSystemId] = useState(systems[0]?.id || "");
  const [docType, setDocType] = useState("Receipt");
  const [docPhotoUrl, setDocPhotoUrl] = useState("");

  const [sysBrand, setSysBrand] = useState("");
  const [sysModel, setSysModel] = useState("");
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
      onAddDocument(title.trim(), docType, finalSystemId, docPhotoUrl);
    } else if (kind === "system") {
      if (!sysBrand.trim()) return setError("Enter a brand.");
      if (!sysModel.trim()) return setError("Enter a model.");
      if (!sysLocation.trim()) return setError("Enter a location.");
      const price = parseFloat(sysPurchasePrice);
      if (!sysPurchasePrice || isNaN(price) || price < 0) return setError("Enter a valid purchase price.");
      const life = parseInt(sysLifeYears, 10);
      if (!sysLifeYears || isNaN(life) || life <= 0) return setError("Enter a valid expected life, in years.");
      const replCost = parseFloat(sysReplacementCost);
      if (!sysReplacementCost || isNaN(replCost) || replCost < 0) return setError("Enter a valid replacement cost.");

      onAddSystem({
        brand: sysBrand.trim(),
        model: sysModel.trim(),
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
          docPhotoUrl={docPhotoUrl} setDocPhotoUrl={setDocPhotoUrl}
          sysBrand={sysBrand} setSysBrand={setSysBrand}
          sysModel={sysModel} setSysModel={setSysModel}
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
