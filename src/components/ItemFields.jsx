import { CATEGORY_META } from "../lib/constants.js";

export default function ItemFields({
  kind, systems,
  title, setTitle,
  dueDate, setDueDate,
  amount, setAmount,
  category, setCategory,
  systemId, setSystemId,
  docType, setDocType,
  docPhotoUrl, setDocPhotoUrl,
  sysBrand, setSysBrand,
  sysModel, setSysModel,
  sysCategory, setSysCategory,
  sysLocation, setSysLocation,
  sysPurchaseDate, setSysPurchaseDate,
  sysPurchasePrice, setSysPurchasePrice,
  sysLifeYears, setSysLifeYears,
  sysReplacementCost, setSysReplacementCost,
  sysWarranty, setSysWarranty,
}) {
  return (
    <>
      {(kind === "task" || kind === "doc") && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === "task" ? "e.g. Replace air filter" : "e.g. Water heater receipt"}
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
      )}

      {kind === "task" && (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        />
      )}

      {kind === "expense" && (
        <>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note (e.g. Gutter cleaning)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            <option>Maintenance</option>
            <option>Repair</option>
            <option>Replacement</option>
            <option>Inspection</option>
          </select>
        </>
      )}

      {kind === "doc" && (
        <>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            <option>Receipt</option>
            <option>Warranty</option>
            <option>Invoice</option>
            <option>Manual</option>
          </select>

          {docPhotoUrl && (
            <img
              src={docPhotoUrl}
              alt=""
              className="w-full mb-2 rounded-lg object-cover"
              style={{ height: 120, border: "1px solid #E0E8D3" }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setDocPhotoUrl(reader.result);
              reader.readAsDataURL(file);
            }}
            className="w-full mb-2 text-[12.5px]"
          />
        </>
      )}

      {(kind === "task" || kind === "expense" || kind === "doc") && (
        <select
          value={systemId}
          onChange={(e) => setSystemId(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={{ border: "1px solid #E0E8D3" }}
        >
          <option value="">General (no system)</option>
          {systems.map((s) => (
            <option key={s.id} value={s.id}>{s.brand} {s.model}</option>
          ))}
        </select>
      )}

      {kind === "system" && (
        <>
          <input
            value={sysBrand}
            onChange={(e) => setSysBrand(e.target.value)}
            placeholder="Brand (e.g. Carrier)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={sysModel}
            onChange={(e) => setSysModel(e.target.value)}
            placeholder="Model (e.g. Infinity)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <select
            value={sysCategory}
            onChange={(e) => setSysCategory(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
          <input
            value={sysLocation}
            onChange={(e) => setSysLocation(e.target.value)}
            placeholder="Location (e.g. Attic, Garage, Kitchen)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <div className="text-[11px] text-stone-500 mb-1">Purchase date</div>
          <input
            type="date"
            value={sysPurchaseDate}
            onChange={(e) => setSysPurchaseDate(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <input
            value={sysPurchasePrice}
            onChange={(e) => setSysPurchasePrice(e.target.value)}
            placeholder="Purchase price ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={sysLifeYears}
            onChange={(e) => setSysLifeYears(e.target.value)}
            placeholder="Expected life (years)"
            inputMode="numeric"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
          <input
            value={sysReplacementCost}
            onChange={(e) => setSysReplacementCost(e.target.value)}
            placeholder="Estimated replacement cost ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <div className="text-[11px] text-stone-500 mb-1">Warranty expiration (optional)</div>
          <input
            type="date"
            value={sysWarranty}
            onChange={(e) => setSysWarranty(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />
        </>
      )}
    </>
  );
}
