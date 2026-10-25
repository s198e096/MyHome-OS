import { useState } from "react";
import { View, Text, TextInput, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Sparkles, Calculator, X, Plus, ChevronDown, Check } from "lucide-react-native";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META, ROOMS, FILTER_OPTIONS, RECURRENCE_OPTIONS, EXPENSE_CATEGORIES, OTHER_BILLS, isBillCategory, systemName } from "../lib/constants.js";
import { scanSystemLabel, scanWarrantyDocs } from "../lib/db.js";
import { KEYBOARD_ACCESSORY_ID } from "./KeyboardDoneBar.js";
import PhotoPicker from "./PhotoPicker.js";
import MultiPhotoPicker from "./MultiPhotoPicker.js";
import SelectModal from "./SelectModal.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };
const pickerBoxStyle = { borderWidth: 1, borderColor: "#E0E8D3", borderRadius: 8, overflow: "hidden" };

const WARRANTY_TYPES = ["General", "Parts", "Labor", "Replacement"];

function formatDuration(months) {
  return months % 12 === 0 ? `${months / 12}-year` : `${months}-month`;
}

function formatMonthYear(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// The single systems.warranty_expiration column (used elsewhere in the app
// as a one-line "is this still covered" summary) is derived from whichever
// of this system's warranty entries expires latest.
function latestExpiration(list) {
  const dates = list.map((w) => w.expirationDate).filter(Boolean);
  return dates.length ? dates.reduce((max, d) => (d > max ? d : max)) : "";
}

function monthsBetween(purchaseDate, expirationDate) {
  if (!purchaseDate || !expirationDate) return null;
  const p = new Date(`${purchaseDate}T00:00:00`);
  const e = new Date(`${expirationDate}T00:00:00`);
  return (e.getFullYear() - p.getFullYear()) * 12 + (e.getMonth() - p.getMonth());
}

function monthsToUnit(months) {
  if (!months || months <= 0) return { value: "", unit: "years" };
  return months % 12 === 0 ? { value: String(months / 12), unit: "years" } : { value: String(months), unit: "months" };
}

// Warranty length is entered as a duration (years or months) rather than an exact
// date — the expiration is derived from purchaseDate + duration, since that's how
// warranties are actually specified ("5-year parts warranty"), not as a calendar date.
function computeExpiration(purchaseDate, durationValue, durationUnit) {
  const n = parseFloat(durationValue);
  if (!purchaseDate || !durationValue || Number.isNaN(n) || n <= 0) return "";
  const months = Math.round(durationUnit === "years" ? n * 12 : n);
  const d = new Date(`${purchaseDate}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Reconstructs a duration (value+unit) for a persisted or AI-extracted warranty row
// that only carries an absolute expirationDate, so the UI can always show a duration
// input instead of a raw date.
export function initWarrantyRow(w, purchaseDate) {
  const { value, unit } = monthsToUnit(monthsBetween(purchaseDate, w.expirationDate));
  return { id: w.id, type: w.type, expirationDate: w.expirationDate || "", estimated: w.estimated, durationValue: value, durationUnit: unit };
}

export function DateField({ label, value, onChange, optional }) {
  const [active, setActive] = useState(!optional || !!value);
  const [androidOpen, setAndroidOpen] = useState(false);
  const dateObj = value ? new Date(`${value}T00:00:00`) : new Date();

  function handleChange(event, selected) {
    if (Platform.OS === "android") setAndroidOpen(false);
    if (event.type === "dismissed") return;
    if (selected) onChange(selected.toISOString().slice(0, 10));
  }

  function handleClear() {
    onChange("");
    setActive(false);
  }

  if (!active) {
    return (
      <View className="mb-2">
        {label && <Text className="text-[11px] text-stone-500 mb-1">{label}</Text>}
        <Pressable onPress={() => setActive(true)} className="w-full px-3 py-2 rounded-lg" style={fieldStyle}>
          <Text className="text-[13.5px]" style={{ color: "#9C978C" }}>Not set — tap to add a date</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="mb-2">
      {label && (
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[11px] text-stone-500">{label}</Text>
          {optional && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <Text className="text-[11px] font-semibold" style={{ color: STATUS_COLOR.red }}>Clear</Text>
            </Pressable>
          )}
        </View>
      )}
      {Platform.OS === "android" && (
        <Pressable onPress={() => setAndroidOpen(true)} className="w-full px-3 py-2 rounded-lg" style={fieldStyle}>
          <Text className="text-[13.5px] text-stone-800">
            {value ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}
          </Text>
        </Pressable>
      )}
      {(Platform.OS === "ios" || androidOpen) && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === "ios" ? "compact" : "default"}
          onChange={handleChange}
          style={Platform.OS === "ios" ? { alignSelf: "flex-start" } : undefined}
        />
      )}
    </View>
  );
}

export default function ItemFields({
  kind, systems,
  title, setTitle,
  dueDate, setDueDate,
  recurrence, setRecurrence,
  amount, setAmount,
  category, setCategory,
  systemId, setSystemId,
  docType, setDocType,
  photoUrl, setPhotoUrl,
  sysBrand, setSysBrand,
  sysModel, setSysModel,
  sysSerial, setSysSerial,
  sysCategory, setSysCategory,
  sysLocation, setSysLocation,
  sysPurchaseDate, setSysPurchaseDate,
  sysPurchasePrice, setSysPurchasePrice,
  sysLifeYears, setSysLifeYears,
  sysReplacementCost, setSysReplacementCost,
  setSysWarranty,
  warranties, setWarranties,
  sysWarrantyRegistered, setSysWarrantyRegistered,
  sysFilterSize, setSysFilterSize,
  sysManualUrl, setSysManualUrl,
  receiptPhotoUrls, setReceiptPhotoUrls,
  warrantyPhotoUrls, setWarrantyPhotoUrls,
  hideCategoryPicker,
  hidePhotoSection,
}) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanningWarranty, setScanningWarranty] = useState(false);
  const [warrantyScanError, setWarrantyScanError] = useState("");
  const [warrantyEstimate, setWarrantyEstimate] = useState(null);
  const [warrantyTypeDropdownIndex, setWarrantyTypeDropdownIndex] = useState(null);
  const [warrantyBlockedMessage, setWarrantyBlockedMessage] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [recurrenceDropdownOpen, setRecurrenceDropdownOpen] = useState(false);

  async function handleScan() {
    setScanning(true);
    setScanError("");
    setSysManualUrl("");
    try {
      const result = await scanSystemLabel(photoUrl);
      if (sysCategory === "appliance") {
        // `brand` holds the appliance's generic name here (e.g.
        // "Refrigerator") rather than a real manufacturer — keep that in
        // place (it's what the appliance icon and list label key off) and
        // fold the scanned manufacturer/model into the model field instead.
        const manufacturerModel = [result.brand, result.model].filter(Boolean).join(" ");
        if (manufacturerModel) setSysModel(manufacturerModel);
      } else {
        if (result.brand) setSysBrand(result.brand);
        if (result.model) setSysModel(result.model);
      }
      if (result.serialNumber) setSysSerial(result.serialNumber);
      if (result.category) setSysCategory(result.category);
      if (result.manualUrl) setSysManualUrl(result.manualUrl);
      // Category alone (e.g. confirming "appliance", which rarely changes
      // anything visible) isn't a useful fill — only count brand/model,
      // since those are what the user is actually waiting to see appear.
      if (!result.brand && !result.model) {
        setScanError("Couldn't read the label clearly. Try a closer, well-lit photo, or fill it in manually.");
      }
    } catch {
      setScanError("AI scan failed. You can fill in the fields manually.");
    } finally {
      setScanning(false);
    }
  }

  async function handleScanWarrantyDocs() {
    setScanningWarranty(true);
    setWarrantyScanError("");
    setWarrantyEstimate(null);
    try {
      const result = await scanWarrantyDocs({
        receiptPhotoUrls,
        warrantyPhotoUrls,
        brand: sysBrand || undefined,
        model: sysModel || undefined,
        category: sysCategory || undefined,
        purchaseDate: sysPurchaseDate || undefined,
      });
      const purchaseDate = result.purchaseDate || sysPurchaseDate;
      if (result.purchaseDate) setSysPurchaseDate(result.purchaseDate);
      if (result.purchasePrice != null) setSysPurchasePrice(String(result.purchasePrice));
      const found = result.warranties || [];
      const confident = found.filter((w) => !w.estimated);
      const estimate = found.find((w) => w.estimated);
      if (confident.length > 0) {
        const withDuration = confident.map((w) => initWarrantyRow(w, purchaseDate));
        setWarranties(withDuration);
        setSysWarranty(latestExpiration(withDuration));
      }
      if (estimate) setWarrantyEstimate(estimate);
      if (!result.purchaseDate && result.purchasePrice == null && confident.length === 0 && !estimate) {
        setWarrantyScanError("Couldn't find a purchase date, price, or warranty info there. You can fill them in manually.");
      }
    } catch {
      setWarrantyScanError("AI scan failed. You can fill in the fields manually.");
    } finally {
      setScanningWarranty(false);
    }
  }

  function acceptWarrantyEstimate() {
    const { value, unit } = monthsToUnit(warrantyEstimate.durationMonths);
    const next = [...warranties, {
      type: warrantyEstimate.type,
      expirationDate: warrantyEstimate.expirationDate,
      estimated: true,
      durationValue: value,
      durationUnit: unit,
    }];
    setWarranties(next);
    setSysWarranty(latestExpiration(next));
    setWarrantyEstimate(null);
  }

  function addWarrantyRow() {
    if (!sysPurchaseDate) {
      setWarrantyBlockedMessage("Add the date installed above before adding a warranty — the expiration is calculated from it.");
      return;
    }
    setWarrantyBlockedMessage("");
    setWarranties([...warranties, { type: "General", durationValue: "", durationUnit: "years", expirationDate: "" }]);
  }

  function updateWarrantyRow(index, patch) {
    const next = warranties.map((w, i) => {
      if (i !== index) return w;
      const merged = { ...w, ...patch };
      merged.expirationDate = computeExpiration(sysPurchaseDate, merged.durationValue, merged.durationUnit);
      return merged;
    });
    setWarranties(next);
    setSysWarranty(latestExpiration(next));
  }

  function removeWarrantyRow(index) {
    const next = warranties.filter((_, i) => i !== index);
    setWarranties(next);
    setSysWarranty(latestExpiration(next));
  }

  function handlePurchaseDateChange(date) {
    setSysPurchaseDate(date);
    setWarrantyBlockedMessage("");
    if (!date) return;
    const next = warranties.map((w) =>
      w.durationValue ? { ...w, expirationDate: computeExpiration(date, w.durationValue, w.durationUnit) } : w
    );
    setWarranties(next);
    setSysWarranty(latestExpiration(next));
  }

  return (
    <>
      {(kind === "task" || kind === "doc" || kind === "furniture") && (
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={
            kind === "task" ? "e.g. Replace air filter" :
            kind === "furniture" ? "e.g. Sofa, Dining table" :
            "e.g. Water heater receipt"
          }
          className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
          style={fieldStyle}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />
      )}

      {kind === "task" && (
        <>
          <DateField label="Start date" value={dueDate} onChange={setDueDate} />
          <Text className="text-[11px] text-stone-500 mb-1">Repeat</Text>
          <Pressable
            onPress={() => setRecurrenceDropdownOpen(true)}
            className="w-full mb-2 flex-row items-center justify-between px-3 py-2.5 rounded-lg"
            style={fieldStyle}
          >
            <Text className="text-[13.5px] text-stone-800">
              {RECURRENCE_OPTIONS.find((r) => r.key === recurrence)?.label || "Does not repeat"}
            </Text>
            <ChevronDown size={14} color="#78716c" />
          </Pressable>
          <SelectModal
            visible={recurrenceDropdownOpen}
            title="Repeat"
            options={[{ value: "", label: "Does not repeat" }, ...RECURRENCE_OPTIONS.map((r) => ({ value: r.key, label: r.label }))]}
            selectedValue={recurrence || ""}
            onSelect={(value) => {
              setRecurrence(value);
              setRecurrenceDropdownOpen(false);
            }}
            onClose={() => setRecurrenceDropdownOpen(false)}
          />
        </>
      )}

      {kind === "expense" && (
        <>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={
              category === OTHER_BILLS
                ? "Which bill? (e.g. Internet)"
                : isBillCategory(category)
                  ? "Note (e.g. October bill)"
                  : "Note (e.g. Gutter cleaning)"
            }
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <View className="w-full mb-2" style={pickerBoxStyle}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              {EXPENSE_CATEGORIES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {kind === "doc" && (
        <>
          <View className="w-full mb-2" style={pickerBoxStyle}>
            <Picker selectedValue={docType} onValueChange={setDocType}>
              <Picker.Item label="Receipt" value="Receipt" />
              <Picker.Item label="Warranty" value="Warranty" />
              <Picker.Item label="Invoice" value="Invoice" />
              <Picker.Item label="Manual" value="Manual" />
            </Picker>
          </View>

          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />
        </>
      )}

      {(kind === "task" || (kind === "expense" && !isBillCategory(category)) || kind === "doc") && (
        <View className="w-full mb-3" style={pickerBoxStyle}>
          <Picker selectedValue={systemId} onValueChange={setSystemId}>
            <Picker.Item label="General" value="" />
            {systems.map((s) => (
              <Picker.Item key={s.id} label={systemName(s)} value={s.id} />
            ))}
          </Picker>
        </View>
      )}

      {kind === "system" && (
        <>
          {!hidePhotoSection && (
            <>
              <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />

              {photoUrl && (
                <Pressable
                  onPress={handleScan}
                  disabled={scanning}
                  className="w-full mb-3 flex-row items-center justify-center gap-1.5 py-2 rounded-lg"
                  style={{ backgroundColor: ACCENT_YELLOW, opacity: scanning ? 0.6 : 1 }}
                >
                  <Sparkles size={15} color={PRIMARY} />
                  <Text className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>
                    {scanning ? "Reading label..." : "Auto-fill with AI"}
                  </Text>
                </Pressable>
              )}
              {scanError && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{scanError}</Text>}
              {sysManualUrl && (
                <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.green }}>
                  Found the owner&apos;s manual — it&apos;ll be attached to this system&apos;s Documents when you save.
                </Text>
              )}
            </>
          )}

          <TextInput
            value={sysBrand}
            onChangeText={setSysBrand}
            placeholder="Brand (e.g. Carrier)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            value={sysModel}
            onChangeText={setSysModel}
            placeholder="Model (e.g. Infinity)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            value={sysSerial}
            onChangeText={setSysSerial}
            placeholder="Serial number (S/N)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          {!hideCategoryPicker && (
            <>
              <Pressable
                onPress={() => setCategoryDropdownOpen(true)}
                className="w-full mb-2 flex-row items-center justify-between px-3 py-2.5 rounded-lg"
                style={fieldStyle}
              >
                <Text className="text-[13.5px] text-stone-800">{CATEGORY_META[sysCategory]?.label || "Select type"}</Text>
                <ChevronDown size={14} color="#78716c" />
              </Pressable>
              <SelectModal
                visible={categoryDropdownOpen}
                title="System type"
                options={Object.entries(CATEGORY_META)
                  .filter(([key]) => key !== "hvac")
                  .map(([key, meta]) => ({ value: key, label: meta.label }))}
                selectedValue={sysCategory}
                onSelect={(value) => {
                  setSysCategory(value);
                  setCategoryDropdownOpen(false);
                }}
                onClose={() => setCategoryDropdownOpen(false)}
              />
            </>
          )}

          {sysCategory === "hvac_indoor" && (
            <View className="rounded-xl bg-white p-3 mb-2" style={fieldStyle}>
              <Text className="text-[13px] font-semibold text-stone-800 mb-2">Filter size</Text>
              <View className="flex-row flex-wrap gap-2 mb-2">
                {FILTER_OPTIONS.map((f) => {
                  const selected = sysFilterSize === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setSysFilterSize(f.key)}
                      className="rounded-full px-3 py-1.5"
                      style={{
                        backgroundColor: selected ? PRIMARY : "white",
                        borderWidth: selected ? 0 : 1,
                        borderColor: "#D8D5CB",
                      }}
                    >
                      <Text className="text-[12.5px] font-semibold" style={{ color: selected ? "white" : "#5F5B50" }}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {sysFilterSize && (
                <View className="rounded-lg px-3 py-2 flex-row items-start gap-2" style={{ backgroundColor: "#EAF1F8" }}>
                  <Calculator size={15} color="#3B5169" style={{ marginTop: 2 }} />
                  <Text className="text-[12px] flex-1" style={{ color: "#3B5169" }}>
                    Filter reminder set automatically: every {FILTER_OPTIONS.find((f) => f.key === sysFilterSize)?.days} days, based on filter size — not a fixed guess.
                  </Text>
                </View>
              )}
            </View>
          )}

          <TextInput
            value={sysLocation}
            onChangeText={setSysLocation}
            placeholder="Location (e.g. Attic, Garage, Kitchen)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />

          {!hidePhotoSection && (
            <View className="mb-2">
              <Text className="text-[13px] font-semibold text-stone-800 mb-2">Receipt & warranty (optional)</Text>
              <MultiPhotoPicker label="Receipt" photoUrls={receiptPhotoUrls} onChange={setReceiptPhotoUrls} />
              <MultiPhotoPicker label="Warranty certificate" photoUrls={warrantyPhotoUrls} onChange={setWarrantyPhotoUrls} />

              {(receiptPhotoUrls.length > 0 || warrantyPhotoUrls.length > 0) && (
                <Pressable
                  onPress={handleScanWarrantyDocs}
                  disabled={scanningWarranty}
                  className="w-full mb-2 flex-row items-center justify-center gap-1.5 py-2 rounded-lg"
                  style={{ backgroundColor: ACCENT_YELLOW, opacity: scanningWarranty ? 0.6 : 1 }}
                >
                  <Sparkles size={15} color={PRIMARY} />
                  <Text className="text-[12.5px] font-semibold" style={{ color: PRIMARY }}>
                    {scanningWarranty ? "Reading documents..." : "Extract purchase date, price & warranty"}
                  </Text>
                </Pressable>
              )}
              {warrantyScanError && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{warrantyScanError}</Text>}
              {warrantyEstimate && (
                <View className="rounded-lg px-3 py-2.5 mb-2" style={{ backgroundColor: "#EAF1F8" }}>
                  <Text className="text-[12px] mb-2" style={{ color: "#3B5169" }}>
                    No warranty info found on your documents, but this product typically carries about a {formatDuration(warrantyEstimate.durationMonths)} warranty — estimated to expire {formatMonthYear(warrantyEstimate.expirationDate)}.
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable onPress={acceptWarrantyEstimate} className="flex-1 py-1.5 rounded-lg items-center" style={{ backgroundColor: PRIMARY }}>
                      <Text className="text-[12px] font-semibold text-white">Use this date</Text>
                    </Pressable>
                    <Pressable onPress={() => setWarrantyEstimate(null)} className="flex-1 py-1.5 rounded-lg items-center" style={fieldStyle}>
                      <Text className="text-[12px] font-semibold text-stone-700">Dismiss</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}

          <DateField label="Date installed" value={sysPurchaseDate} onChange={handlePurchaseDateChange} optional />

          <TextInput
            value={sysPurchasePrice}
            onChangeText={setSysPurchasePrice}
            placeholder="Purchase price ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            value={sysLifeYears}
            onChangeText={setSysLifeYears}
            placeholder="Expected life (years)"
            inputMode="numeric"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <TextInput
            value={sysReplacementCost}
            onChangeText={setSysReplacementCost}
            placeholder="Estimated replacement cost ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />

          <View className="mb-2">
            <Text className="text-[11px] text-stone-500 mb-1">Warranty (optional)</Text>
            {warranties.length === 0 && (
              <Text className="text-[12px] text-stone-400 mb-2">Nothing added yet.</Text>
            )}
            {warranties.map((w, i) => (
              <View key={i} className="rounded-lg p-2 mb-2" style={fieldStyle}>
                <View className="flex-row items-center justify-between mb-2">
                  <Pressable
                    onPress={() => setWarrantyTypeDropdownIndex(i)}
                    className="flex-1 flex-row items-center justify-between px-3 py-2 rounded-lg"
                    style={fieldStyle}
                  >
                    <Text className="text-[13px] text-stone-800">{w.type || "Select type"}</Text>
                    <ChevronDown size={14} color="#78716c" />
                  </Pressable>
                  <Pressable onPress={() => removeWarrantyRow(i)} hitSlop={8} className="pl-2">
                    <X size={16} color="#B8B4A8" />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2 mb-1.5">
                  <TextInput
                    value={w.durationValue}
                    onChangeText={(v) => updateWarrantyRow(i, { durationValue: v })}
                    placeholder="Length"
                    inputMode="decimal"
                    className="px-3 py-2 rounded-lg text-[13px]"
                    style={[fieldStyle, { width: 72 }]}
                    inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  />
                  <View className="flex-row gap-1.5">
                    {["years", "months"].map((u) => {
                      const selected = (w.durationUnit || "years") === u;
                      return (
                        <Pressable
                          key={u}
                          onPress={() => updateWarrantyRow(i, { durationUnit: u })}
                          className="rounded-full px-2.5 py-1.5"
                          style={{ backgroundColor: selected ? PRIMARY : "white", borderWidth: selected ? 0 : 1, borderColor: "#D8D5CB" }}
                        >
                          <Text className="text-[11.5px] font-semibold" style={{ color: selected ? "white" : "#5F5B50" }}>
                            {u === "years" ? "Years" : "Months"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <Text className="text-[12px]" style={{ color: w.expirationDate ? "#5F5B50" : "#9C978C" }}>
                  {w.expirationDate
                    ? `Expires ${formatMonthYear(w.expirationDate)}`
                    : sysPurchaseDate
                      ? "Enter a length to calculate the expiration"
                      : "Add the date installed above to calculate the expiration"}
                </Text>
              </View>
            ))}
            <Pressable onPress={addWarrantyRow} className="flex-row items-center gap-1" hitSlop={6}>
              <Plus size={13} color={PRIMARY} />
              <Text className="text-[12px] font-semibold" style={{ color: PRIMARY }}>Add warranty</Text>
            </Pressable>
            {!!warrantyBlockedMessage && (
              <Text className="text-[12px] mt-1.5" style={{ color: STATUS_COLOR.red }}>{warrantyBlockedMessage}</Text>
            )}
            {setSysWarrantyRegistered && (
              <Pressable
                onPress={() => setSysWarrantyRegistered(!sysWarrantyRegistered)}
                className="flex-row items-center gap-2 mt-3"
                hitSlop={4}
              >
                <View
                  className="items-center justify-center rounded"
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: sysWarrantyRegistered ? PRIMARY : "white",
                    borderWidth: sysWarrantyRegistered ? 0 : 1,
                    borderColor: "#D8D5CB",
                  }}
                >
                  {sysWarrantyRegistered && <Check size={14} color="white" />}
                </View>
                <Text className="text-[13px] text-stone-700">Registered with vendor</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {kind === "furniture" && (
        <>
          <View className="w-full mb-2" style={pickerBoxStyle}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              {ROOMS.map((r) => (
                <Picker.Item key={r} label={r} value={r} />
              ))}
            </Picker>
          </View>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Estimated value ($)"
            inputMode="decimal"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />

          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />
        </>
      )}

      <SelectModal
        visible={warrantyTypeDropdownIndex !== null}
        title="Warranty type"
        options={WARRANTY_TYPES.map((t) => ({ value: t, label: t }))}
        selectedValue={warrantyTypeDropdownIndex !== null ? warranties[warrantyTypeDropdownIndex]?.type : null}
        onSelect={(value) => {
          updateWarrantyRow(warrantyTypeDropdownIndex, { type: value });
          setWarrantyTypeDropdownIndex(null);
        }}
        onClose={() => setWarrantyTypeDropdownIndex(null)}
        allowCustom
        customLabel="Custom type..."
        customTitle="Custom warranty type"
        customPlaceholder="e.g. Compressor, Sealed system"
      />
    </>
  );
}
