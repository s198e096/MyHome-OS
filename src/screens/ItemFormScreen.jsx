import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PRIMARY, STATUS_COLOR, STATUS_BG, ROOMS } from "../lib/constants.js";
import ItemFields from "../components/ItemFields.jsx";

const KIND_NOUNS = { task: "task", expense: "expense", system: "system", doc: "document", furniture: "furniture item" };

export default function ItemFormScreen({
  kind, item, systems, onBack,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddExpense, onUpdateExpense, onDeleteExpense,
  onAddDocument, onUpdateDocument, onDeleteDocument,
  onAddSystem, onUpdateSystem, onDeleteSystem, onAttachManual,
  onAddFurniture, onUpdateFurniture, onDeleteFurniture,
}) {
  const isEdit = !!item;

  const [title, setTitle] = useState(
    kind === "expense" ? item?.note || "" : kind === "furniture" ? item?.name || "" : item?.title || item?.label || ""
  );
  const [dueDate, setDueDate] = useState(item?.dueDate || "2026-10-01");
  const [amount, setAmount] = useState(
    kind === "furniture"
      ? item?.value != null ? String(item.value) : ""
      : item?.amount != null ? String(item.amount) : ""
  );
  const [category, setCategory] = useState(
    kind === "furniture" ? item?.room || ROOMS[0] : item?.category || "Maintenance"
  );
  const [systemId, setSystemId] = useState(item ? item.systemId || "" : systems[0]?.id || "");
  const [docType, setDocType] = useState(item?.type || "Receipt");
  const [photoUrl, setPhotoUrl] = useState(item?.photoUrl || "");

  const [sysBrand, setSysBrand] = useState(item?.brand || "");
  const [sysModel, setSysModel] = useState(item?.model || "");
  const [sysCategory, setSysCategory] = useState(item?.category || "hvac_indoor");
  const [sysLocation, setSysLocation] = useState(item?.location || "");
  const [sysPurchaseDate, setSysPurchaseDate] = useState(item?.purchaseDate || "2026-01-01");
  const [sysPurchasePrice, setSysPurchasePrice] = useState(item?.purchasePrice != null ? String(item.purchasePrice) : "");
  const [sysLifeYears, setSysLifeYears] = useState(item?.expectedLifeYears != null ? String(item.expectedLifeYears) : "10");
  const [sysReplacementCost, setSysReplacementCost] = useState(item?.replacementCost != null ? String(item.replacementCost) : "");
  const [sysWarranty, setSysWarranty] = useState(item?.warrantyExpiration || "");
  const [sysFilterSize, setSysFilterSize] = useState(item?.filterSize || "");
  const [sysManualUrl, setSysManualUrl] = useState("");

  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titles = {
    task: isEdit ? "Edit task" : "Add task",
    expense: isEdit ? "Edit expense" : "Add expense",
    system: isEdit ? "Edit system" : "Add system",
    doc: isEdit ? "Edit document" : "Add document",
    furniture: isEdit ? "Edit furniture" : "Add furniture",
  };
  const backLabels = {
    task: "Tasks",
    expense: "Costs",
    doc: "Docs",
    system: isEdit ? `${item.brand} ${item.model}` : "Systems",
    furniture: "Furniture",
  };

  async function handleSubmit() {
    const finalSystemId = systemId || null;
    setError("");
    try {
      if (kind === "task") {
        if (!title.trim()) return setError("Enter a task name.");
        if (isEdit) await onUpdateTask(item.id, { title: title.trim(), dueDate, systemId: finalSystemId });
        else await onAddTask(title.trim(), dueDate, finalSystemId);
      } else if (kind === "expense") {
        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) return setError("Enter an amount.");
        if (isEdit) await onUpdateExpense(item.id, { amount: num, category, note: title.trim() || category, systemId: finalSystemId });
        else await onAddExpense(num, category, title.trim() || category, finalSystemId);
      } else if (kind === "doc") {
        if (!title.trim()) return setError("Enter a document label.");
        if (isEdit) await onUpdateDocument(item.id, { label: title.trim(), type: docType, systemId: finalSystemId, photoUrl: photoUrl || null });
        else await onAddDocument(title.trim(), docType, finalSystemId, photoUrl);
      } else if (kind === "furniture") {
        if (!title.trim()) return setError("Enter a furniture item name.");
        const val = parseFloat(amount);
        if (!amount || isNaN(val) || val < 0) return setError("Enter a valid estimated value.");

        const payload = { name: title.trim(), room: category, value: val, photoUrl: photoUrl || null };
        if (isEdit) await onUpdateFurniture(item.id, payload);
        else await onAddFurniture(payload);
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

        const payload = {
          brand: sysBrand.trim(),
          model: sysModel.trim(),
          category: sysCategory,
          location: sysLocation.trim(),
          purchaseDate: sysPurchaseDate,
          purchasePrice: price,
          expectedLifeYears: life,
          replacementCost: replCost,
          warrantyExpiration: sysWarranty,
          photoUrl: photoUrl || null,
          filterSize: sysCategory === "hvac_indoor" ? sysFilterSize || null : null,
        };
        const savedSystem = isEdit ? await onUpdateSystem(item.id, payload) : await onAddSystem(payload);
        if (sysManualUrl && savedSystem) {
          await onAttachManual(savedSystem.id, savedSystem.brand, savedSystem.model, sysManualUrl);
        }
      }
    } catch (err) {
      setError(
        err?.message?.includes("schema cache")
          ? `Couldn't save — the database is missing a column this needs (${err.message.match(/'([^']+)'/)?.[1] || "unknown"}). Run the latest Supabase migration, then try again.`
          : "Couldn't save. Try again."
      );
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
    else if (kind === "furniture") onDeleteFurniture(item.id);
    else if (kind === "system") onDeleteSystem(item.id);
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 mb-3 text-[13px] text-stone-500">
        <ChevronLeft size={16} /> {backLabels[kind]}
      </button>

      {photoUrl && !photoUrl.toLowerCase().endsWith(".pdf") && (kind === "system" || kind === "furniture" || kind === "doc") && (
        <div className="rounded-xl bg-white p-2 mb-4" style={{ border: "1px solid #E0E8D3" }}>
          <img
            src={photoUrl}
            alt=""
            className="w-full rounded-lg object-cover"
            style={{ height: 180 }}
          />
        </div>
      )}

      <div className="text-[17px] font-semibold text-stone-900 mb-4">{titles[kind]}</div>

      <ItemFields
        kind={kind} systems={systems}
        title={title} setTitle={setTitle}
        dueDate={dueDate} setDueDate={setDueDate}
        amount={amount} setAmount={setAmount}
        category={category} setCategory={setCategory}
        systemId={systemId} setSystemId={setSystemId}
        docType={docType} setDocType={setDocType}
        photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
        sysBrand={sysBrand} setSysBrand={setSysBrand}
        sysModel={sysModel} setSysModel={setSysModel}
        sysCategory={sysCategory} setSysCategory={setSysCategory}
        sysLocation={sysLocation} setSysLocation={setSysLocation}
        sysPurchaseDate={sysPurchaseDate} setSysPurchaseDate={setSysPurchaseDate}
        sysPurchasePrice={sysPurchasePrice} setSysPurchasePrice={setSysPurchasePrice}
        sysLifeYears={sysLifeYears} setSysLifeYears={setSysLifeYears}
        sysReplacementCost={sysReplacementCost} setSysReplacementCost={setSysReplacementCost}
        sysWarranty={sysWarranty} setSysWarranty={setSysWarranty}
        sysFilterSize={sysFilterSize} setSysFilterSize={setSysFilterSize}
        sysManualUrl={sysManualUrl} setSysManualUrl={setSysManualUrl}
      />

      {error && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</div>}

      <button
        onClick={handleSubmit}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold"
        style={{ background: PRIMARY, color: "white" }}
      >
        {isEdit ? "Save changes" : "Save"}
      </button>

      {isEdit && (
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
      )}
    </div>
  );
}
