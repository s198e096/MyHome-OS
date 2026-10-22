import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, STATUS_BG, ROOMS, systemName } from "../lib/constants.js";
import ItemFields, { initWarrantyRow } from "../components/ItemFields.js";
import KeyboardDoneBar from "../components/KeyboardDoneBar.js";

const KIND_NOUNS = { task: "task", expense: "expense", system: "system", doc: "document", furniture: "furniture item" };

export default function ItemFormScreen({
  kind, item, hint, systems, onBack,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddExpense, onUpdateExpense, onDeleteExpense,
  onAddDocument, onUpdateDocument, onDeleteDocument,
  onAddSystem, onUpdateSystem, onDeleteSystem, onAttachManual,
  warranties: existingWarranties, onAddWarranty, onDeleteWarranty,
  onAddFurniture, onUpdateFurniture, onDeleteFurniture,
}) {
  const isEdit = !!item;

  const [title, setTitle] = useState(
    kind === "expense" ? item?.note || "" : kind === "furniture" ? item?.name || "" : item?.title || item?.label || ""
  );
  const [dueDate, setDueDate] = useState(item?.dueDate || "2026-10-01");
  const [recurrence, setRecurrence] = useState(item?.recurrence || "");
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
  const [sysSerial, setSysSerial] = useState(item?.serialNumber || "");
  const [sysCategory, setSysCategory] = useState(item?.category || "hvac_indoor");
  const [sysLocation, setSysLocation] = useState(item?.location || "");
  const [sysPurchaseDate, setSysPurchaseDate] = useState(item?.purchaseDate || "");
  const [sysPurchasePrice, setSysPurchasePrice] = useState(item?.purchasePrice != null ? String(item.purchasePrice) : "");
  const [sysLifeYears, setSysLifeYears] = useState(item?.expectedLifeYears != null ? String(item.expectedLifeYears) : "10");
  const [sysReplacementCost, setSysReplacementCost] = useState(item?.replacementCost != null ? String(item.replacementCost) : "");
  const [sysWarranty, setSysWarranty] = useState(item?.warrantyExpiration || "");
  const [sysFilterSize, setSysFilterSize] = useState(item?.filterSize || "");
  const [sysPlanned, setSysPlanned] = useState(item?.plannedReplacementDate || "");
  const [sysWarrantyRegistered, setSysWarrantyRegistered] = useState(!!item?.warrantyRegistered);
  const [sysManualUrl, setSysManualUrl] = useState("");
  const [receiptPhotoUrls, setReceiptPhotoUrls] = useState([]);
  const [warrantyPhotoUrls, setWarrantyPhotoUrls] = useState([]);
  const [warrantyList, setWarrantyList] = useState(() =>
    (existingWarranties || []).map((w) => initWarrantyRow(w, item?.purchaseDate || ""))
  );

  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const insets = useSafeAreaInsets();

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
    system: isEdit ? systemName(item) : "Systems",
    furniture: "Furniture",
  };

  async function handleSubmit() {
    const finalSystemId = systemId || null;
    setError("");
    try {
      if (kind === "task") {
        if (!title.trim()) return setError("Enter a task name.");
        if (isEdit) await onUpdateTask(item.id, { title: title.trim(), dueDate, systemId: finalSystemId, recurrence: recurrence || null });
        else await onAddTask(title.trim(), dueDate, finalSystemId, recurrence || null);
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
        // Nothing here is required — partial saves are expected (e.g. just
        // adding a receipt photo to a system that isn't fully filled in yet).
        const num = (s) => (s.trim() ? parseFloat(s) : null);
        const int = (s) => (s.trim() ? parseInt(s, 10) : null);
        const payload = {
          brand: sysBrand.trim() || null,
          model: sysModel.trim() || null,
          serialNumber: sysSerial.trim() || null,
          category: sysCategory,
          location: sysLocation.trim(),
          purchaseDate: sysPurchaseDate || null,
          purchasePrice: num(sysPurchasePrice),
          expectedLifeYears: int(sysLifeYears),
          replacementCost: num(sysReplacementCost),
          warrantyExpiration: sysWarranty || null,
          photoUrl: photoUrl || null,
          filterSize: sysCategory === "hvac_indoor" ? sysFilterSize || null : null,
          // null clears a plan that was set; "" (never set) is left out of the save.
          plannedReplacementDate: sysPlanned || (item?.plannedReplacementDate ? null : ""),
          warrantyRegistered: sysWarrantyRegistered,
        };
        const savedSystem = isEdit ? await onUpdateSystem(item.id, payload) : await onAddSystem(payload);
        if (sysManualUrl && savedSystem) {
          await onAttachManual(savedSystem.id, savedSystem.brand, savedSystem.model, sysManualUrl);
        }
        if (savedSystem) {
          const name = systemName(savedSystem);
          for (const [i, url] of receiptPhotoUrls.entries()) {
            const label = receiptPhotoUrls.length > 1 ? `${name} Receipt ${i + 1}` : `${name} Receipt`;
            await onAddDocument(label, "Receipt", savedSystem.id, url);
          }
          for (const [i, url] of warrantyPhotoUrls.entries()) {
            const label = warrantyPhotoUrls.length > 1 ? `${name} Warranty ${i + 1}` : `${name} Warranty`;
            await onAddDocument(label, "Warranty", savedSystem.id, url);
          }
          // Replace this system's warranty rows wholesale with the current
          // list — simpler than diffing, and warranty counts are small.
          for (const w of existingWarranties || []) {
            await onDeleteWarranty(w.id);
          }
          for (const w of warrantyList) {
            if (w.type.trim() && w.expirationDate) {
              await onAddWarranty(savedSystem.id, w.type.trim(), w.expirationDate, !!w.estimated);
            }
          }
        }
      }
      onBack();
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
    onBack();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      style={{ paddingTop: insets.top + 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">{backLabels[kind]}</Text>
      </Pressable>

      {photoUrl && !photoUrl.toLowerCase().endsWith(".pdf") && (kind === "system" || kind === "furniture" || kind === "doc") && (
        <View className="rounded-xl bg-white p-2 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Image source={{ uri: photoUrl }} style={{ width: "100%", height: 180, borderRadius: 8 }} resizeMode="cover" />
        </View>
      )}

      {hint && (
        <View className="rounded-lg px-3 py-2 mb-3" style={{ backgroundColor: "#EAF1F8" }}>
          <Text className="text-[12px]" style={{ color: "#3B5169" }}>{hint}</Text>
        </View>
      )}

      <Text className="text-[17px] font-semibold text-stone-900 mb-4">{titles[kind]}</Text>

      <ItemFields
        kind={kind} systems={systems}
        title={title} setTitle={setTitle}
        dueDate={dueDate} setDueDate={setDueDate}
        recurrence={recurrence} setRecurrence={setRecurrence}
        amount={amount} setAmount={setAmount}
        category={category} setCategory={setCategory}
        systemId={systemId} setSystemId={setSystemId}
        docType={docType} setDocType={setDocType}
        photoUrl={photoUrl} setPhotoUrl={setPhotoUrl}
        sysBrand={sysBrand} setSysBrand={setSysBrand}
        sysModel={sysModel} setSysModel={setSysModel}
        sysSerial={sysSerial} setSysSerial={setSysSerial}
        sysCategory={sysCategory} setSysCategory={setSysCategory}
        sysLocation={sysLocation} setSysLocation={setSysLocation}
        sysPurchaseDate={sysPurchaseDate} setSysPurchaseDate={setSysPurchaseDate}
        sysPurchasePrice={sysPurchasePrice} setSysPurchasePrice={setSysPurchasePrice}
        sysLifeYears={sysLifeYears} setSysLifeYears={setSysLifeYears}
        sysReplacementCost={sysReplacementCost} setSysReplacementCost={setSysReplacementCost}
        sysWarranty={sysWarranty} setSysWarranty={setSysWarranty}
        warranties={warrantyList} setWarranties={setWarrantyList}
        sysWarrantyRegistered={sysWarrantyRegistered} setSysWarrantyRegistered={setSysWarrantyRegistered}
        sysFilterSize={sysFilterSize} setSysFilterSize={setSysFilterSize}
        sysPlanned={sysPlanned} setSysPlanned={setSysPlanned}
        sysManualUrl={sysManualUrl} setSysManualUrl={setSysManualUrl}
        receiptPhotoUrls={receiptPhotoUrls} setReceiptPhotoUrls={setReceiptPhotoUrls}
        warrantyPhotoUrls={warrantyPhotoUrls} setWarrantyPhotoUrls={setWarrantyPhotoUrls}
      />

      {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        className="w-full py-2.5 rounded-lg items-center"
        style={{ backgroundColor: PRIMARY }}
      >
        <Text className="text-[13.5px] font-semibold text-white">{isEdit ? "Save changes" : "Save"}</Text>
      </Pressable>

      {isEdit && (
        <Pressable
          onPress={handleDelete}
          className="w-full py-2.5 rounded-lg mt-2 items-center"
          style={{
            borderWidth: 1,
            borderColor: "#F0C9C9",
            backgroundColor: confirmingDelete ? STATUS_BG.red : "white",
          }}
        >
          <Text className="text-[13.5px] font-semibold" style={{ color: STATUS_COLOR.red }}>
            {confirmingDelete ? "Tap again to delete" : `Delete ${KIND_NOUNS[kind]}`}
          </Text>
        </Pressable>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
    <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}
