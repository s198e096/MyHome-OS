import { useState } from "react";
import { Sparkles, Calculator } from "lucide-react";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META, ROOMS, FILTER_OPTIONS } from "../lib/constants.js";
import { scanSystemLabel } from "../lib/db.js";
import PhotoPicker from "./PhotoPicker.jsx";

export default function ItemFields({
  kind, systems,
  title, setTitle,
  dueDate, setDueDate,
  amount, setAmount,
  category, setCategory,
  systemId, setSystemId,
  docType, setDocType,
  photoUrl, setPhotoUrl,
  sysBrand, setSysBrand,
  sysModel, setSysModel,
  sysCategory, setSysCategory,
  sysLocation, setSysLocation,
  sysPurchaseDate, setSysPurchaseDate,
  sysPurchasePrice, setSysPurchasePrice,
  sysLifeYears, setSysLifeYears,
  sysReplacementCost, setSysReplacementCost,
  sysWarranty, setSysWarranty,
  sysFilterSize, setSysFilterSize,
}) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  async function handleScan() {
    setScanning(true);
    setScanError("");
    try {
      const result = await scanSystemLabel(photoUrl);
      if (result.brand) setSysBrand(result.brand);
      if (result.model) setSysModel(result.model);
      if (result.category) setSysCategory(result.category);
      if (!result.brand && !result.model && !result.category) {
        setScanError("Couldn't read the label clearly. Try a closer, well-lit photo, or fill it in manually.");
      }
    } catch {
      setScanError("AI scan failed. You can fill in the fields manually.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      {(kind === "task" || kind === "doc" || kind === "furniture") && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            kind === "task" ? "e.g. Replace air filter" :
            kind === "furniture" ? "e.g. Sofa, Dining table" :
            "e.g. Water heater receipt"
          }
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

          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />
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
          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />

          {photoUrl && (
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-semibold"
              style={{ background: ACCENT_YELLOW, color: PRIMARY, opacity: scanning ? 0.6 : 1 }}
            >
              <Sparkles size={15} />
              {scanning ? "Reading label..." : "Auto-fill with AI"}
            </button>
          )}
          {scanError && <div className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{scanError}</div>}

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
            {Object.entries(CATEGORY_META).filter(([key]) => key !== "hvac").map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>

          {sysCategory === "hvac_indoor" && (
            <div className="rounded-xl bg-white p-3 mb-2" style={{ border: "1px solid #E0E8D3" }}>
              <div className="text-[13px] font-semibold text-stone-800 mb-2">Filter size</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {FILTER_OPTIONS.map((f) => {
                  const selected = sysFilterSize === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setSysFilterSize(f.key)}
                      className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
                      style={{
                        background: selected ? PRIMARY : "white",
                        color: selected ? "white" : "#5F5B50",
                        border: selected ? "none" : "1px solid #D8D5CB",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              {sysFilterSize && (
                <div className="rounded-lg px-3 py-2 text-[12px] flex items-start gap-2" style={{ background: "#EAF1F8", color: "#3B5169" }}>
                  <Calculator size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Filter reminder set automatically: every {FILTER_OPTIONS.find((f) => f.key === sysFilterSize)?.days} days, based on filter size — not a fixed guess.
                  </span>
                </div>
              )}
            </div>
          )}

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

      {kind === "furniture" && (
        <>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          >
            {ROOMS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Estimated value ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={{ border: "1px solid #E0E8D3" }}
          />

          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />
        </>
      )}
    </>
  );
}
