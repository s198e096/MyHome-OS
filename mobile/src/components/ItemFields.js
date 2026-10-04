import { useState } from "react";
import { View, Text, TextInput, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Sparkles, Calculator } from "lucide-react-native";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META, ROOMS, FILTER_OPTIONS, systemName } from "../lib/constants.js";
import { scanSystemLabel } from "../lib/db.js";
import { KEYBOARD_ACCESSORY_ID } from "./KeyboardDoneBar.js";
import PhotoPicker from "./PhotoPicker.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };
const pickerBoxStyle = { borderWidth: 1, borderColor: "#E0E8D3", borderRadius: 8, overflow: "hidden" };

function DateField({ label, value, onChange, optional }) {
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
  sysWarranty, setSysWarranty,
  sysFilterSize, setSysFilterSize,
  sysManualUrl, setSysManualUrl,
  hideCategoryPicker,
  hidePhotoSection,
}) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  async function handleScan() {
    setScanning(true);
    setScanError("");
    setSysManualUrl("");
    try {
      const result = await scanSystemLabel(photoUrl);
      if (result.brand) setSysBrand(result.brand);
      if (result.model) setSysModel(result.model);
      if (result.serialNumber) setSysSerial(result.serialNumber);
      if (result.category) setSysCategory(result.category);
      if (result.manualUrl) setSysManualUrl(result.manualUrl);
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

      {kind === "task" && <DateField value={dueDate} onChange={setDueDate} />}

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
            placeholder="Note (e.g. Gutter cleaning)"
            className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
          <View className="w-full mb-2" style={pickerBoxStyle}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              <Picker.Item label="Maintenance" value="Maintenance" />
              <Picker.Item label="Repair" value="Repair" />
              <Picker.Item label="Replacement" value="Replacement" />
              <Picker.Item label="Inspection" value="Inspection" />
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

      {(kind === "task" || kind === "expense" || kind === "doc") && (
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
            <View className="w-full mb-2" style={pickerBoxStyle}>
              <Picker selectedValue={sysCategory} onValueChange={setSysCategory}>
                {Object.entries(CATEGORY_META).filter(([key]) => key !== "hvac").map(([key, meta]) => (
                  <Picker.Item key={key} label={meta.label} value={key} />
                ))}
              </Picker>
            </View>
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

          <DateField label="Date installed" value={sysPurchaseDate} onChange={setSysPurchaseDate} />

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

          <DateField label="Warranty expiration (optional)" value={sysWarranty} onChange={setSysWarranty} optional />
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
    </>
  );
}
