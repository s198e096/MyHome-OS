import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Sparkles, ChevronLeft, ChevronRight, Check, Search, X, Plus, Minus } from "lucide-react-native";
import {
  PRIMARY,
  HERO_BG_TOP,
  HERO_BG_BOTTOM,
  ACCENT_YELLOW,
  STATUS_COLOR,
  STATUS_BG,
  CATEGORY_META,
  ONBOARDING_STRUCTURE_CATEGORIES,
  ONBOARDING_FIXTURE_CATEGORIES,
  systemIcon,
} from "../lib/constants.js";
import { autocompleteAddress } from "../lib/mapbox.js";
import { fetchPropertyDetails, scanSystemLabel, scanWarrantyDocs } from "../lib/db.js";
import { buildFeatureSummary } from "../lib/propertyFeatures.js";
import { useAppData } from "../lib/app-data-context.js";
import OnboardingTransition from "../components/OnboardingTransition.js";
import KeyboardDoneBar, { KEYBOARD_ACCESSORY_ID } from "../components/KeyboardDoneBar.js";
import ItemFields, { initWarrantyRow } from "../components/ItemFields.js";
import PhotoPicker from "../components/PhotoPicker.js";
import MultiPhotoPicker from "../components/MultiPhotoPicker.js";
import HvacGuideIllustration from "../components/HvacGuideIllustrations.js";
import WaterHeaterGuideIllustration from "../components/WaterHeaterGuideIllustrations.js";
import GeneratorGuideIllustration from "../components/GeneratorGuideIllustrations.js";
import SolarGuideIllustration from "../components/SolarGuideIllustrations.js";
import EvChargerGuideIllustration from "../components/EvChargerGuideIllustrations.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

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

// Shared "add a few of these, one at a time" step used for systems,
// appliances, and house-structure items after the property step. Each add
// persists immediately (addSystem), so nothing is lost if the app is
// backgrounded mid-step; items can be removed again with one tap.
function QuickAddStep({ title, subtitle, categories, fixedCategory, doneLabel, onDone, onBack, backLabel }) {
  const insets = useSafeAreaInsets();
  const { systems, addSystem, deleteSystem } = useAppData();
  const [category, setCategory] = useState(fixedCategory || categories[0]);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [finishing, setFinishing] = useState(false);

  const relevantCategories = fixedCategory ? [fixedCategory] : categories;
  const added = systems.filter((s) => relevantCategories.includes(s.category));

  async function handleAdd() {
    setAdding(true);
    setAddError("");
    const trimmedName = name.trim();
    // Guard against a stale `category` value (e.g. left over from this same
    // component instance being reused for a previous step's categories) —
    // always fall back to a category this step actually offers.
    const categoryToAdd = fixedCategory || (categories.includes(category) ? category : categories[0]);
    try {
      // One tap adds `quantity` separate entries (so e.g. "3 windows" doesn't
      // mean tapping Add three times) — numbered individually when a name
      // was given, so they stay distinguishable in the list.
      for (let i = 0; i < quantity; i++) {
        const brand = trimmedName ? (quantity > 1 ? `${trimmedName} ${i + 1}` : trimmedName) : null;
        await addSystem({ category: categoryToAdd, brand, model: null, location: "" });
      }
      setName("");
      setQuantity(1);
    } catch {
      setAddError("Couldn't add that. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDone() {
    setFinishing(true);
    try {
      await onDone();
    } finally {
      setFinishing(false);
    }
  }

  const activeMeta = CATEGORY_META[fixedCategory || category];
  const ActiveIcon = activeMeta.icon;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {onBack && (
          <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
            <ChevronLeft size={16} color="#78716c" />
            <Text className="text-[13px] text-stone-500">{backLabel}</Text>
          </Pressable>
        )}

        <Text className="text-[17px] font-semibold text-stone-900 mb-1">{title}</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">{subtitle}</Text>

        {added.length > 0 && (
          <>
            <Text className="text-[11px] font-semibold text-stone-500 mb-1.5">ADDED ({added.length})</Text>
            <View className="rounded-xl bg-white px-3 mb-5" style={fieldStyle}>
              {added.map((sys, i) => {
                const meta = CATEGORY_META[sys.category];
                const Icon = systemIcon(sys);
                return (
                  <View
                    key={sys.id}
                    className="flex-row items-center justify-between py-2.5"
                    style={{ borderBottomWidth: i < added.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      <View className="items-center justify-center rounded-lg" style={{ width: 28, height: 28, backgroundColor: "#F5F8F0" }}>
                        <Icon size={14} color="#5F5B50" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13.5px] text-stone-800">{sys.brand ? sys.brand : meta.label}</Text>
                        {!!sys.brand && <Text className="text-[11px] text-stone-400">{meta.label}</Text>}
                      </View>
                    </View>
                    <Pressable onPress={() => deleteSystem(sys.id)} hitSlop={8}>
                      <X size={16} color="#B8B4A8" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View className="rounded-xl bg-white p-3 mb-5" style={fieldStyle}>
          {!fixedCategory && (
            <>
              <Text className="text-[11px] text-stone-500 mb-1.5">What are you adding?</Text>
              <View className="flex-row flex-wrap gap-2 mb-3">
                {categories.map((key) => {
                  const meta = CATEGORY_META[key];
                  const Icon = meta.icon;
                  const selected = category === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setCategory(key)}
                      className="items-center rounded-lg py-2.5"
                      style={{
                        minWidth: 84,
                        flexGrow: 1,
                        backgroundColor: selected ? PRIMARY : "#F5F8F0",
                        borderWidth: selected ? 0 : 1,
                        borderColor: "#E0E8D3",
                      }}
                    >
                      <Icon size={18} color={selected ? "white" : "#5F5B50"} />
                      <Text className="text-[12px] font-semibold mt-1" style={{ color: selected ? "white" : "#5F5B50" }}>
                        {meta.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-[11px] text-stone-500 mb-1">Name (optional)</Text>
              <View className="flex-row items-center rounded-lg" style={fieldStyle}>
                <View className="items-center justify-center" style={{ width: 32 }}>
                  <ActiveIcon size={14} color="#9C978C" />
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={fixedCategory ? "e.g. Refrigerator, Dishwasher" : `e.g. ${activeMeta.label}`}
                  className="flex-1 py-2 pr-3 text-[13.5px]"
                  inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
              </View>
            </View>
            <View>
              <Text className="text-[11px] text-stone-500 mb-1">Qty</Text>
              <View className="flex-row items-center rounded-lg" style={fieldStyle}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="items-center justify-center"
                  style={{ width: 32, height: 36 }}
                  hitSlop={6}
                >
                  <Minus size={14} color={PRIMARY} />
                </Pressable>
                <Text className="text-[13.5px] font-semibold text-center" style={{ width: 22 }}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="items-center justify-center"
                  style={{ width: 32, height: 36 }}
                  hitSlop={6}
                >
                  <Plus size={14} color={PRIMARY} />
                </Pressable>
              </View>
            </View>
          </View>

          {addError && <Text className="text-[12px] mt-2" style={{ color: STATUS_COLOR.red }}>{addError}</Text>}

          <Pressable
            onPress={handleAdd}
            disabled={adding}
            className="w-full py-2.5 rounded-lg items-center flex-row justify-center gap-1.5 mt-3"
            style={{ backgroundColor: ACCENT_YELLOW, opacity: adding ? 0.6 : 1 }}
          >
            <Plus size={15} color={PRIMARY} />
            <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>
              {quantity > 1 ? `Add ${quantity} ${activeMeta.label.toLowerCase()}s` : `Add ${activeMeta.label.toLowerCase()}`}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleDone}
          disabled={finishing}
          className="w-full py-2.5 rounded-lg items-center"
          style={{ backgroundColor: PRIMARY, opacity: finishing ? 0.6 : 1 }}
        >
          <Text className="text-[13.5px] font-semibold text-white">{finishing ? "Saving..." : doneLabel}</Text>
        </Pressable>
      </ScrollView>
      <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}

// A system counts as "completed" for the walkthrough once it has any detail
// beyond what quick-add sets (category/brand/empty location) — i.e. the user
// has actually been through SystemDetailsStep and saved something for it.
function systemHasDetails(s) {
  return !!(s.model || s.photoUrl || s.purchaseDate || s.warrantyExpiration || s.replacementCost || s.expectedLifeYears || s.purchasePrice || s.filterSize);
}

// Full-screen hub listing every added system with its completion status —
// tap a completed one to review/edit it, or a not-started one to fill it in.
// Every exit from SystemDetailsStep (Save or Skip) returns here, rather than
// auto-advancing through a fixed queue, so the user can work through them in
// any order and stop whenever they're satisfied.
function SystemsOverviewStep({ systems, onSelect, onFinish }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Your systems</Text>
      <Text className="text-[12.5px] text-stone-500 mb-4">
        Tap a completed system to review it, or a not-started one to fill it in. Finish whenever you&apos;re ready — you can always add more later.
      </Text>

      {systems.length === 0 ? (
        <View className="rounded-xl bg-white p-4 mb-6" style={fieldStyle}>
          <Text className="text-[13px] text-stone-500">You haven&apos;t added any systems yet.</Text>
        </View>
      ) : (
        <View className="rounded-xl bg-white px-3 mb-6" style={fieldStyle}>
          {systems.map((sys, i) => {
            const meta = CATEGORY_META[sys.category];
            const Icon = systemIcon(sys);
            const done = systemHasDetails(sys);
            return (
              <Pressable
                key={sys.id}
                onPress={() => onSelect(sys)}
                className="flex-row items-center justify-between py-2.5"
                style={{ borderBottomWidth: i < systems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Icon size={16} color="#5F5B50" />
                  <Text className="text-[13.5px] text-stone-800 flex-1" numberOfLines={1}>
                    {sys.brand ? sys.brand : meta.label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: done ? STATUS_BG.green : "#F2F0EA" }}>
                    <Text className="text-[10.5px] font-semibold" style={{ color: done ? STATUS_COLOR.green : "#9C9890" }}>
                      {done ? "Completed" : "Not started"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    <Text className="text-[11.5px] font-semibold" style={{ color: PRIMARY }}>{done ? "Edit" : "Start"}</Text>
                    <ChevronRight size={14} color={PRIMARY} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable onPress={onFinish} className="w-full py-2.5 rounded-lg items-center" style={{ backgroundColor: PRIMARY }}>
        <Text className="text-[13.5px] font-semibold text-white">Finish setup</Text>
      </Pressable>
    </ScrollView>
  );
}

// Fills in one system's details: a photo (AI auto-fill, same scanSystemLabel
// flow as the regular Add/Edit System form) or manual entry, then returns to
// the systems overview. Nothing here is required — Save keeps whatever was
// filled in (even partial), and Skip returns with no changes at all, so this
// never blocks finishing onboarding.
function SystemDetailsStep({ system, onDone }) {
  const insets = useSafeAreaInsets();
  const { updateSystem, attachManualDocument, addDocument, warranties, addWarranty, deleteWarranty } = useAppData();
  const isStructure = ONBOARDING_STRUCTURE_CATEGORIES.includes(system.category);
  // Toilets rarely have an easy-to-photograph label (it's often inside the
  // tank, if printed at all) — still try to read one if the photo happens
  // to include it, but frame the prompt around condition instead, and don't
  // treat a missing label as a scan failure.
  const labelOptional = system.category === "toilet";

  // Guides the user through: 1) a photo (label for systems/appliances, a
  // condition photo for structure items) which auto-fills from the label
  // when possible, 2) an optional receipt/warranty photo, 3) the rest of
  // the fields, pre-filled from the scan where available.
  const [subStep, setSubStep] = useState("photo");

  const [photoUrl, setPhotoUrl] = useState(system.photoUrl || "");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const [receiptPhotoUrls, setReceiptPhotoUrls] = useState([]);
  const [warrantyPhotoUrls, setWarrantyPhotoUrls] = useState([]);
  const [scanningWarranty, setScanningWarranty] = useState(false);
  const [warrantyScanError, setWarrantyScanError] = useState("");
  const [warrantyEstimate, setWarrantyEstimate] = useState(null);
  const [warrantyList, setWarrantyList] = useState(() =>
    warranties.filter((w) => w.systemId === system.id).map((w) => initWarrantyRow(w, system.purchaseDate || ""))
  );

  const [sysBrand, setSysBrand] = useState(system.brand || "");
  const [sysModel, setSysModel] = useState(system.model || "");
  const [sysSerial, setSysSerial] = useState(system.serialNumber || "");
  const [sysCategory, setSysCategory] = useState(system.category);
  const [sysLocation, setSysLocation] = useState(system.location || "");
  const [sysPurchaseDate, setSysPurchaseDate] = useState(system.purchaseDate || "");
  const [sysPurchasePrice, setSysPurchasePrice] = useState(system.purchasePrice != null ? String(system.purchasePrice) : "");
  const [sysLifeYears, setSysLifeYears] = useState(system.expectedLifeYears != null ? String(system.expectedLifeYears) : "");
  const [sysReplacementCost, setSysReplacementCost] = useState(system.replacementCost != null ? String(system.replacementCost) : "");
  const [sysWarranty, setSysWarranty] = useState(system.warrantyExpiration || "");
  const [sysWarrantyRegistered, setSysWarrantyRegistered] = useState(!!system.warrantyRegistered);
  const [sysFilterSize, setSysFilterSize] = useState(system.filterSize || "");
  const [sysManualUrl, setSysManualUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = CATEGORY_META[system.category];

  async function runScan() {
    setScanning(true);
    setScanError("");
    setSysManualUrl("");
    try {
      const result = await scanSystemLabel(photoUrl);
      if (system.category === "appliance") {
        // `brand` holds the appliance's generic name here (e.g.
        // "Refrigerator", from the checklist step) rather than a real
        // manufacturer — keep that in place (it's what the appliance icon
        // and list label key off) and fold the scanned manufacturer/model
        // into the model field instead.
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
      // For toilets, no label found isn't a failure — it's the expected
      // case when the photo is just of its condition.
      if (!result.brand && !result.model && !labelOptional) {
        setScanError("Couldn't read the label clearly. You can fill in the fields manually.");
      }
    } catch {
      setScanError("AI scan failed. You can fill in the fields manually.");
    } finally {
      setScanning(false);
    }
  }

  async function handlePhotoContinue() {
    // Only auto-scan when there's no real brand/model yet — avoids
    // re-scanning (and re-billing the API) when revisiting an already-
    // filled-in system via the list. A guided walkthrough's generic
    // placeholder (e.g. "Gas furnace") doesn't count as "real" here, so
    // scanning still runs the first time a label photo is added for it —
    // same for the appliance checklist, which writes the appliance's own
    // name (e.g. "Refrigerator") into `brand` as a placeholder, not an
    // actual manufacturer brand.
    const isGenericApplianceLabel = system.category === "appliance" && COMMON_APPLIANCES.includes(sysBrand.replace(/ \d+$/, ""));
    const hasRealBrand = sysBrand && !GENERIC_UNIT_LABELS.has(sysBrand) && !isGenericApplianceLabel;
    if (photoUrl && !isStructure && !hasRealBrand && !sysModel) {
      await runScan();
    }
    setSubStep("receipt");
  }

  async function runWarrantyScan() {
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
        setWarrantyList(withDuration);
        setSysWarranty(latestExpiration(withDuration));
      }
      if (estimate) setWarrantyEstimate(estimate);
      if (!result.purchaseDate && result.purchasePrice == null && confident.length === 0 && !estimate) {
        setWarrantyScanError("Couldn't find a purchase date, price, or warranty info there. You can fill them in manually.");
      }
    } catch {
      setWarrantyScanError("Couldn't read those documents. You can fill in purchase date and warranty manually.");
    } finally {
      setScanningWarranty(false);
    }
  }

  async function handleDocumentsContinue() {
    if (receiptPhotoUrls.length > 0 || warrantyPhotoUrls.length > 0) {
      await runWarrantyScan();
    }
    setSubStep("fields");
  }

  function acceptWarrantyEstimate() {
    const row = initWarrantyRow(
      { type: warrantyEstimate.type, expirationDate: warrantyEstimate.expirationDate, estimated: true },
      sysPurchaseDate
    );
    const next = [...warrantyList, row];
    setWarrantyList(next);
    setSysWarranty(latestExpiration(next));
    setWarrantyEstimate(null);
  }

  async function handleSaveNext() {
    setError("");
    setSaving(true);
    try {
      const num = (s) => (s.trim() ? parseFloat(s) : null);
      const int = (s) => (s.trim() ? parseInt(s, 10) : null);
      const updated = await updateSystem(system.id, {
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
        warrantyRegistered: sysWarrantyRegistered,
        photoUrl: photoUrl || null,
        filterSize: sysCategory === "hvac_indoor" ? sysFilterSize || null : null,
      });
      if (sysManualUrl && updated) {
        await attachManualDocument(updated.id, updated.brand, updated.model, sysManualUrl);
      }
      if (updated) {
        const name = updated.brand || meta.label;
        for (const [i, url] of receiptPhotoUrls.entries()) {
          const label = receiptPhotoUrls.length > 1 ? `${name} Receipt ${i + 1}` : `${name} Receipt`;
          await addDocument(label, "Receipt", updated.id, url);
        }
        for (const [i, url] of warrantyPhotoUrls.entries()) {
          const label = warrantyPhotoUrls.length > 1 ? `${name} Warranty ${i + 1}` : `${name} Warranty`;
          await addDocument(label, "Warranty", updated.id, url);
        }
        // Replace this system's warranty rows wholesale with the current
        // list — simpler than diffing, and warranty counts are small.
        for (const w of warranties.filter((existing) => existing.systemId === updated.id)) {
          await deleteWarranty(w.id);
        }
        for (const w of warrantyList) {
          if (w.type.trim() && w.expirationDate) {
            await addWarranty(updated.id, w.type.trim(), w.expirationDate, !!w.estimated);
          }
        }
      }
      onDone();
    } catch {
      setError("Couldn't save. You can try again or skip for now.");
    } finally {
      setSaving(false);
    }
  }

  const backToList = (
    <Pressable onPress={onDone} className="flex-row items-center gap-1 mb-1">
      <ChevronLeft size={16} color="#78716c" />
      <Text className="text-[13px] text-stone-500">Back to list</Text>
    </Pressable>
  );

  if (subStep === "photo") {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 bg-[#F5F8F0] px-4"
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {backToList}
          <Text className="text-[17px] font-semibold text-stone-900 mb-1">
            {isStructure
              ? `Add a picture of its condition (${meta.label})`
              : labelOptional
                ? `Add a picture of the ${meta.label}`
                : `Take a picture of the ${meta.label} label`}
          </Text>
          <Text className="text-[12.5px] text-stone-500 mb-4">
            {isStructure
              ? "This helps you track its condition over time. You can skip if you don't have one handy."
              : labelOptional
                ? "A picture of its condition is useful on its own, and if there's a visible brand label (often inside the tank) we'll try to read it too."
                : "We'll automatically read the brand, model, and other details from it."}
          </Text>

          <PhotoPicker photoUrl={photoUrl} onChange={setPhotoUrl} />

          {scanning && (
            <View className="flex-row items-center gap-2 mb-3">
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text className="text-[12.5px] text-stone-500">Reading label...</Text>
            </View>
          )}
          {scanError && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{scanError}</Text>}

          <Pressable
            onPress={handlePhotoContinue}
            disabled={scanning}
            className="w-full py-2.5 rounded-lg items-center mb-2"
            style={{ backgroundColor: PRIMARY, opacity: scanning ? 0.6 : 1 }}
          >
            <Text className="text-[13.5px] font-semibold text-white">
              {scanning ? "Reading label..." : "Continue"}
            </Text>
          </Pressable>
          <Pressable onPress={handlePhotoContinue} disabled={scanning} className="py-2.5 items-center">
            <Text className="text-[13px] font-semibold text-stone-500">Skip, I don&apos;t have a picture</Text>
          </Pressable>
        </ScrollView>
        <KeyboardDoneBar />
      </KeyboardAvoidingView>
    );
  }

  if (subStep === "receipt") {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 bg-[#F5F8F0] px-4"
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {backToList}

          <Text className="text-[17px] font-semibold text-stone-900 mb-1">
            {isStructure ? "Add a receipt photo?" : "Add your receipt & warranty"}
          </Text>
          <Text className="text-[12.5px] text-stone-500 mb-4">
            {isStructure
              ? "If you have a receipt from a repair or installation, add it here. Optional, if applicable."
              : "We'll read the purchase date, price, and warranty details from these automatically. Optional — add either, both, or skip."}
          </Text>

          {isStructure ? (
            <MultiPhotoPicker photoUrls={receiptPhotoUrls} onChange={setReceiptPhotoUrls} />
          ) : (
            <>
              <MultiPhotoPicker label="Receipt" photoUrls={receiptPhotoUrls} onChange={setReceiptPhotoUrls} />
              <MultiPhotoPicker label="Warranty certificate" photoUrls={warrantyPhotoUrls} onChange={setWarrantyPhotoUrls} />
            </>
          )}

          {scanningWarranty && (
            <View className="flex-row items-center gap-2 mb-3 mt-1">
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text className="text-[12.5px] text-stone-500">Reading documents...</Text>
            </View>
          )}
          {warrantyScanError && <Text className="text-[12px] mb-2 mt-1" style={{ color: STATUS_COLOR.red }}>{warrantyScanError}</Text>}

          <View className="flex-row gap-2 mt-2">
            <Pressable
              onPress={() => setSubStep("photo")}
              disabled={scanningWarranty}
              className="flex-row items-center justify-center gap-1 px-4 py-2.5 rounded-lg"
              style={{ borderWidth: 1, borderColor: "#D8D5CB" }}
            >
              <ChevronLeft size={16} color="#78716c" />
              <Text className="text-[13px] text-stone-500">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleDocumentsContinue}
              disabled={scanningWarranty}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: PRIMARY, opacity: scanningWarranty ? 0.6 : 1 }}
            >
              <Text className="text-[13.5px] font-semibold text-white">
                {scanningWarranty ? "Reading documents..." : "Continue"}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleDocumentsContinue} disabled={scanningWarranty} className="py-2.5 items-center">
            <Text className="text-[13px] font-semibold text-stone-500">Skip, I don&apos;t have any</Text>
          </Pressable>
        </ScrollView>
        <KeyboardDoneBar />
      </KeyboardAvoidingView>
    );
  }

  // subStep === "fields"
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {backToList}

        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Fill in the rest</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">
          {sysBrand || sysModel ? "Auto-filled from the label — review and edit anything below." : "Nothing here is required."}
        </Text>

        {sysManualUrl && (
          <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.green }}>
            Found the owner&apos;s manual — it&apos;ll be attached to this system&apos;s Documents when you save.
          </Text>
        )}

        {warrantyEstimate && (
          <View className="rounded-lg px-3 py-2.5 mb-3" style={{ backgroundColor: "#EAF1F8" }}>
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

        <ItemFields
          kind="system"
          systems={[]}
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
          sysManualUrl={sysManualUrl} setSysManualUrl={setSysManualUrl}
          hideCategoryPicker
          hidePhotoSection
        />

        {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

        <View className="flex-row gap-2 mb-2 mt-4">
          <Pressable
            onPress={() => setSubStep("receipt")}
            disabled={saving}
            className="flex-row items-center justify-center gap-1 px-4 py-2.5 rounded-lg"
            style={{ borderWidth: 1, borderColor: "#D8D5CB" }}
          >
            <ChevronLeft size={16} color="#78716c" />
            <Text className="text-[13px] text-stone-500">Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSaveNext}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={{ backgroundColor: PRIMARY, opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-[13.5px] font-semibold text-white">
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={onDone} disabled={saving} className="w-full py-2.5 rounded-lg items-center">
          <Text className="text-[13.5px] font-semibold text-stone-500">Skip for now</Text>
        </Pressable>
      </ScrollView>
      <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}

// Default names for the units a guided HVAC walkthrough creates: the same
// labels the unguided path falls back to, so both routes read the same. The
// user can rename either whenever they like.
const HVAC_INDOOR_NAME = CATEGORY_META.hvac_indoor.label;
const HVAC_OUTDOOR_NAME = CATEGORY_META.hvac_outdoor.label;

// Placeholder names earlier versions wrote for HVAC units. Systems saved back
// then still carry them, so they must keep counting as placeholders (see
// GENERIC_UNIT_LABELS below).
const LEGACY_HVAC_LABELS = [
  "Gas furnace",
  "Central AC condenser",
  "Heat pump air handler",
  "Heat pump outdoor unit",
  "Mini split indoor head",
  "Mini split outdoor compressor",
  "Packaged HVAC unit",
  "Through-wall AC unit",
];

// The five HVAC configurations we can recognize. Each maps to one or two
// actual system entries (most configurations split into an indoor and an
// outdoor unit) — the real brand/model are left for the user to fill in
// later via the regular details walkthrough, but `brand` holds the default
// name ("HVAC - Indoor Unit" / "HVAC - Outdoor Unit"). Deliberately not
// `model`: that field is what systemHasDetails() checks to mark a system
// "Completed", so a placeholder there would make picking a type alone look
// like a finished walkthrough.
const HVAC_TYPES = {
  furnace_ac: {
    label: "Gas Furnace + Central AC",
    hint: "Most common",
    units: [
      { category: "hvac_indoor", brand: HVAC_INDOOR_NAME },
      { category: "hvac_outdoor", brand: HVAC_OUTDOOR_NAME },
    ],
  },
  heat_pump: {
    label: "Central heat pump system",
    units: [
      { category: "hvac_indoor", brand: HVAC_INDOOR_NAME },
      { category: "hvac_outdoor", brand: HVAC_OUTDOOR_NAME },
    ],
  },
  mini_split: {
    label: "Ductless mini split",
    units: [
      { category: "hvac_indoor", brand: HVAC_INDOOR_NAME },
      { category: "hvac_outdoor", brand: HVAC_OUTDOOR_NAME },
    ],
  },
  packaged: {
    label: "Packaged HVAC system",
    units: [{ category: "hvac_outdoor", brand: HVAC_OUTDOOR_NAME }],
  },
  through_wall: {
    label: "Through-wall AC",
    units: [{ category: "hvac_indoor", brand: HVAC_INDOOR_NAME }],
  },
};

// A short decision tree for "Guide me" — each node is a yes/no question;
// "yes"/"no" point to either another node key, or directly to an HVAC_TYPES
// key once the answers resolve to a specific configuration.
const HVAC_GUIDE_TREE = {
  start: {
    text: "Do you have ductwork — vents in the ceiling or floor throughout the house?",
    yes: "packaged_check",
    no: "wall_unit",
  },
  packaged_check: {
    text: "Is there a single box outside (often on the roof or a concrete pad) that handles both heating and cooling by itself, with no separate furnace indoors?",
    yes: "packaged",
    no: "heat_source",
  },
  heat_source: {
    text: "Does the heat come from a gas furnace indoors (a flame or pilot light), rather than a heat pump outside?",
    yes: "furnace_ac",
    no: "heat_pump",
  },
  wall_unit: {
    text: "Is it a single unit built into one wall, cooling just that room — not a separate box outside connected by a thin pipe?",
    yes: "through_wall",
    no: "mini_split",
  },
};

// The five water heater types we can recognize. Unlike HVAC these are
// always a single unit — the real brand/model are left for later, but
// `brand` gets a descriptive placeholder (see the note on HVAC_TYPES above
// for why it's `brand` and not `model`).
const WATER_HEATER_TYPES = {
  tank: {
    label: "Conventional Tank Water Heater",
    hint: "Most common",
    units: [{ category: "water_heater", brand: "Conventional tank water heater" }],
  },
  tankless: {
    label: "Tankless (On-Demand) Water Heater",
    units: [{ category: "water_heater", brand: "Tankless water heater" }],
  },
  heat_pump_wh: {
    label: "Heat Pump (Hybrid) Water Heater",
    units: [{ category: "water_heater", brand: "Heat pump (hybrid) water heater" }],
  },
  solar: {
    label: "Solar Water Heater",
    units: [{ category: "water_heater", brand: "Solar water heater" }],
  },
  point_of_use: {
    label: "Point-of-Use Water Heater",
    units: [{ category: "water_heater", brand: "Point-of-use water heater" }],
  },
};

// Decision tree for the water heater "Guide me" flow — same shape as
// HVAC_GUIDE_TREE above.
const WATER_HEATER_GUIDE_TREE = {
  start: {
    text: "Is there a tank that stores a large amount of hot water (usually 40–80 gallons)?",
    yes: "tank_fan_check",
    no: "single_fixture_check",
  },
  tank_fan_check: {
    text: "Does it have a fan on top, or make a humming/compressor sound like a mini air conditioner?",
    yes: "heat_pump_wh",
    no: "solar_check",
  },
  solar_check: {
    text: "Are there solar panels or a collector on the roof connected to it?",
    yes: "solar",
    no: "tank",
  },
  single_fixture_check: {
    text: "Is it a small unit installed right at (or under) a single sink or fixture, just for that one tap?",
    yes: "point_of_use",
    no: "tankless",
  },
};

// The four backup generator types we can recognize. Always a single unit.
const GENERATOR_TYPES = {
  standby: {
    label: "Standby Generator",
    hint: "Most common",
    units: [{ category: "generator", brand: "Standby generator" }],
  },
  portable: {
    label: "Portable Generator",
    units: [{ category: "generator", brand: "Portable generator" }],
  },
  inverter: {
    label: "Inverter Generator",
    units: [{ category: "generator", brand: "Inverter generator" }],
  },
  diesel: {
    label: "Diesel Generator",
    units: [{ category: "generator", brand: "Diesel generator" }],
  },
};

// Decision tree for the generator "Guide me" flow — same shape as the
// others above.
const GENERATOR_GUIDE_TREE = {
  start: {
    text: "Is it permanently installed outside and turns on automatically during a power outage, without you starting it?",
    yes: "fuel_check",
    no: "size_check",
  },
  fuel_check: {
    text: "Does it run on diesel fuel, rather than natural gas or propane?",
    yes: "diesel",
    no: "standby",
  },
  size_check: {
    text: "Is it a small, quiet unit you'd carry by a handle — rather than a larger wheeled unit you roll into place?",
    yes: "inverter",
    no: "portable",
  },
};

// The three solar panel installations we can recognize. Always a single
// unit.
const SOLAR_TYPES = {
  roof_mounted: {
    label: "Roof-Mounted Solar Panels",
    hint: "Most common",
    units: [{ category: "solar", brand: "Roof-mounted solar panels" }],
  },
  ground_mounted: {
    label: "Ground-Mounted Solar Panels",
    units: [{ category: "solar", brand: "Ground-mounted solar panels" }],
  },
  roof_tiles: {
    label: "Solar Roof Tiles / Shingles",
    units: [{ category: "solar", brand: "Solar roof tiles / shingles" }],
  },
};

// Decision tree for the solar panel "Guide me" flow — same shape as the
// others above.
const SOLAR_GUIDE_TREE = {
  start: {
    text: "Are the panels mounted on the ground or a pole away from the house, rather than on the roof?",
    yes: "ground_mounted",
    no: "tile_check",
  },
  tile_check: {
    text: "Do the panels look like a normal roof surface itself (flat, shingle-like), rather than separate panels racked on top of the roof?",
    yes: "roof_tiles",
    no: "roof_mounted",
  },
};

// The three EV charger configurations we can recognize — Level 1, and
// Level 2 split into hardwired vs. plug-in. Always a single unit.
const EV_CHARGER_TYPES = {
  level1: {
    label: "Level 1 Charger",
    hint: "Plugs into a standard outlet",
    units: [{ category: "ev_charger", brand: "Level 1 EV charger" }],
  },
  level2_hardwired: {
    label: "Level 2 Charger — Hardwired",
    hint: "Wired directly, no plug",
    units: [{ category: "ev_charger", brand: "Level 2 EV charger (hardwired)" }],
  },
  level2_plugin: {
    label: "Level 2 Charger — Plug-in",
    hint: "Plugs into a dedicated outlet",
    units: [{ category: "ev_charger", brand: "Level 2 EV charger (plug-in)" }],
  },
};

// Decision tree for the EV charger "Guide me" flow — first distinguishes
// Level 1 from Level 2, then (within Level 2) hardwired from plug-in.
const EV_CHARGER_GUIDE_TREE = {
  start: {
    text: "Does it plug into a regular wall outlet (the kind you'd plug a toaster into), charging slowly overnight?",
    yes: "level1",
    no: "hardwire_check",
  },
  hardwire_check: {
    text: "Is it wired directly into your electrical panel, with no plug or outlet at all?",
    yes: "level2_hardwired",
    no: "level2_plugin",
  },
};

// Every placeholder label a guided walkthrough can write into `brand` (see
// HVAC_TYPES above for why it's `brand` and not `model`). SystemDetailsStep
// uses this to tell a real, user/scan-provided brand apart from one of these
// placeholders, so it knows whether a label photo still needs auto-scanning.
const GENERIC_UNIT_LABELS = new Set([
  ...LEGACY_HVAC_LABELS,
  ...[HVAC_TYPES, WATER_HEATER_TYPES, GENERATOR_TYPES, SOLAR_TYPES, EV_CHARGER_TYPES].flatMap((types) =>
    Object.values(types).flatMap((t) => t.units.map((u) => u.brand))
  ),
]);

// Creates/updates the system entries for a chosen type's unit list — shared
// by every guided walkthrough (HVAC, water heater, ...). Reuses any existing
// system of the matching category (whether a bare one with no brand set, or
// already fully configured from a previous pass through onboarding) instead
// of duplicating it — re-running onboarding (e.g. after restarting the app
// partway through) re-confirms a type, it doesn't add a second unit.
async function applySystemUnits(units, { systems, addSystem, updateSystem }) {
  const claimed = new Set();
  for (const unit of units) {
    const existing = systems.find((s) => s.category === unit.category && !claimed.has(s.id));
    if (existing) {
      claimed.add(existing.id);
      try {
        await updateSystem(existing.id, { brand: unit.brand });
        continue;
      } catch {
        // The matched system no longer exists server-side (e.g. deleted
        // outside the app since this screen last loaded its system list) —
        // fall through and create a fresh one instead of failing outright.
      }
    }
    await addSystem({ category: unit.category, brand: unit.brand, model: null, location: "" });
  }
}

// Shared chrome for every screen in a guided system walkthrough (HVAC, water
// heater, ...): a back button (when provided), a "Skip" link that confirms
// before bailing out of the whole step, and the step's title.
function OnboardingGuideScreen({ title, skipSubject, onBackPress, onSkip, children }) {
  const insets = useSafeAreaInsets();
  const [confirmingSkip, setConfirmingSkip] = useState(false);

  return (
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center justify-between mb-3">
        {onBackPress ? (
          <Pressable onPress={onBackPress} className="flex-row items-center gap-1">
            <ChevronLeft size={16} color="#78716c" />
            <Text className="text-[13px] text-stone-500">Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={() => setConfirmingSkip(true)} hitSlop={8}>
          <Text className="text-[13px] font-semibold text-stone-400">Skip</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text className="text-[17px] font-semibold text-stone-900 mb-4 text-center">{title}</Text>
        {children}
      </View>

      {confirmingSkip && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} className="items-center justify-center px-6">
          <Pressable
            onPress={() => setConfirmingSkip(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" }}
          />
          <View className="w-full rounded-xl bg-white p-4" style={fieldStyle}>
            <Text className="text-[15px] font-semibold text-stone-900 mb-1.5">Skip {skipSubject}?</Text>
            <Text className="text-[12.5px] text-stone-500 mb-4">
              You sure you want to skip {skipSubject}? You can always add it later from the Systems tab.
            </Text>
            <Pressable onPress={onSkip} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
              <Text className="text-[13.5px] font-semibold text-white">Yes, skip it</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmingSkip(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
              <Text className="text-[13.5px] font-semibold text-stone-700">Keep going</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// Shared "pick a type" list for a guided walkthrough's type-picker screen —
// each row is its own card, with the suggested one (from "Guide me", if any)
// highlighted. `types` is a map of key -> { label, hint? }.
function TypePickerList({ types, suggestedKey, onSelect, saving, Icon }) {
  return (
    <View className="rounded-xl bg-white p-1.5 mb-4" style={fieldStyle}>
      {Object.entries(types).map(([key, type]) => {
        const suggested = key === suggestedKey;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            disabled={saving}
            className="flex-row items-center justify-between py-2.5 px-2.5 mb-1 rounded-lg"
            style={{
              backgroundColor: suggested ? ACCENT_YELLOW : "white",
              borderWidth: suggested ? 1.5 : 0,
              borderColor: PRIMARY,
            }}
          >
            <View className="flex-row items-center gap-2.5 flex-1">
              <View
                className="items-center justify-center rounded-lg"
                style={{ width: 30, height: 30, backgroundColor: suggested ? "white" : "#F5F8F0" }}
              >
                <Icon size={16} color={suggested ? PRIMARY : "#5F5B50"} />
              </View>
              <View className="flex-1">
                <Text className={`text-[13.5px] text-stone-800 ${suggested ? "font-semibold" : ""}`}>{type.label}</Text>
                {suggested ? (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Sparkles size={11} color={PRIMARY} />
                    <Text className="text-[11px] font-semibold" style={{ color: PRIMARY }}>Suggested, based on your answers</Text>
                  </View>
                ) : (
                  type.hint && <Text className="text-[11px] text-stone-400">{type.hint}</Text>
                )}
              </View>
            </View>
            {saving ? <ActivityIndicator size="small" color={PRIMARY} /> : <ChevronRight size={15} color={suggested ? PRIMARY : "#B8B4A8"} />}
          </Pressable>
        );
      })}
    </View>
  );
}

// Dedicated HVAC walkthrough, run right after the property step and before
// the rest of the systems. If an HVAC system already exists (e.g. added
// manually, or this step was already completed once), skips straight to "do
// you know your type?"; otherwise asks first whether there's an HVAC system
// at all. Every screen can be skipped (with a confirmation), since nothing
// here is required to finish onboarding.
function HvacOnboardingStep({ hasExisting, onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function applyHvacType(typeKey) {
    setSaving(true);
    setError("");
    try {
      await applySystemUnits(HVAC_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function answerGuide(yes) {
    const node = HVAC_GUIDE_TREE[guideNode];
    const next = yes ? node.yes : node.no;
    if (HVAC_GUIDE_TREE[next]) {
      setGuideHistory((h) => [...h, guideNode]);
      setGuideNode(next);
    } else {
      setSuggestedType(next);
      setSubStep("pick");
    }
  }

  function backGuide() {
    if (guideHistory.length === 0) {
      setSubStep("know");
      return;
    }
    setGuideNode(guideHistory[guideHistory.length - 1]);
    setGuideHistory((h) => h.slice(0, -1));
  }

  const Icon = CATEGORY_META.hvac.icon;

  const guideScreenProps = { title: "Let's add your HVAC system", skipSubject: "HVAC" };

  if (subStep === "ask") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={onBack} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you have an HVAC system?</Text>
        <Pressable onPress={() => setSubStep("know")} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={onDone} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No, I don&apos;t have one</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "know") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={hasExisting ? onBack : () => setSubStep("ask")} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you know your HVAC system type?</Text>
        <Pressable
          onPress={() => { setSuggestedType(null); setSubStep("pick"); }}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { setGuideNode("start"); setGuideHistory([]); setSubStep("guide"); }}
          className="w-full py-2.5 rounded-lg items-center"
          style={fieldStyle}
        >
          <Text className="text-[13.5px] font-semibold text-stone-700">Guide me</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "guide") {
    const node = HVAC_GUIDE_TREE[guideNode];
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={backGuide} onSkip={onDone}>
        <HvacGuideIllustration guideKey={guideNode} />
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{node.text}</Text>
        <Pressable onPress={() => answerGuide(true)} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={() => answerGuide(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  // subStep === "pick"
  return (
    <OnboardingGuideScreen {...guideScreenProps} onBackPress={() => setSubStep("know")} onSkip={onDone}>
      <Text className="text-[12.5px] text-stone-500 mb-3 text-center">
        {suggestedType ? "Based on your answers, this looks like your setup — tap to confirm, or pick a different one." : "Which best describes your system?"}
      </Text>
      <TypePickerList types={HVAC_TYPES} suggestedKey={suggestedType} onSelect={applyHvacType} saving={saving} Icon={Icon} />
      {error && <Text className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
    </OnboardingGuideScreen>
  );
}

// Same shape as HvacOnboardingStep above, for water heaters. Water heaters
// are always a single unit, so there's no indoor/outdoor split to reconcile.
function WaterHeaterOnboardingStep({ hasExisting, onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function applyWaterHeaterType(typeKey) {
    setSaving(true);
    setError("");
    try {
      await applySystemUnits(WATER_HEATER_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function answerGuide(yes) {
    const node = WATER_HEATER_GUIDE_TREE[guideNode];
    const next = yes ? node.yes : node.no;
    if (WATER_HEATER_GUIDE_TREE[next]) {
      setGuideHistory((h) => [...h, guideNode]);
      setGuideNode(next);
    } else {
      setSuggestedType(next);
      setSubStep("pick");
    }
  }

  function backGuide() {
    if (guideHistory.length === 0) {
      setSubStep("know");
      return;
    }
    setGuideNode(guideHistory[guideHistory.length - 1]);
    setGuideHistory((h) => h.slice(0, -1));
  }

  const Icon = CATEGORY_META.water_heater.icon;
  const guideScreenProps = { title: "Let's add your water heater", skipSubject: "your water heater" };

  if (subStep === "ask") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={onBack} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you have a water heater?</Text>
        <Pressable onPress={() => setSubStep("know")} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={onDone} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No, I don&apos;t have one</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "know") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={hasExisting ? onBack : () => setSubStep("ask")} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you know your water heater type?</Text>
        <Pressable
          onPress={() => { setSuggestedType(null); setSubStep("pick"); }}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { setGuideNode("start"); setGuideHistory([]); setSubStep("guide"); }}
          className="w-full py-2.5 rounded-lg items-center"
          style={fieldStyle}
        >
          <Text className="text-[13.5px] font-semibold text-stone-700">Guide me</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "guide") {
    const node = WATER_HEATER_GUIDE_TREE[guideNode];
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={backGuide} onSkip={onDone}>
        <WaterHeaterGuideIllustration guideKey={guideNode} />
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{node.text}</Text>
        <Pressable onPress={() => answerGuide(true)} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={() => answerGuide(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  // subStep === "pick"
  return (
    <OnboardingGuideScreen {...guideScreenProps} onBackPress={() => setSubStep("know")} onSkip={onDone}>
      <Text className="text-[12.5px] text-stone-500 mb-3 text-center">
        {suggestedType ? "Based on your answers, this looks like your setup — tap to confirm, or pick a different one." : "Which best describes your water heater?"}
      </Text>
      <TypePickerList types={WATER_HEATER_TYPES} suggestedKey={suggestedType} onSelect={applyWaterHeaterType} saving={saving} Icon={Icon} />
      {error && <Text className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
    </OnboardingGuideScreen>
  );
}

// A plain yes/no gate for an optional add-on step where there's no
// meaningful "type" to guide the user toward (unlike HVAC, water heaters,
// generators, solar, or EV chargers) — so no guided walkthrough, just one
// question deciding whether to enter the follow-up step at all.
function YesNoPrompt({ title, question, yesLabel = "Yes", noLabel = "No, skip this", onBack, onYes, onNo }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Back</Text>
      </Pressable>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text className="text-[17px] font-semibold text-stone-900 mb-4 text-center">{title}</Text>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{question}</Text>
        <Pressable onPress={onYes} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">{yesLabel}</Text>
        </Pressable>
        <Pressable onPress={onNo} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">{noLabel}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// List of common household appliances for the checklist below. Anything
// not listed can still be added later from the Systems tab — this just
// covers the common case faster than typing each one in by hand.
const COMMON_APPLIANCES = [
  "Refrigerator",
  "Dishwasher",
  "Washing Machine",
  "Dryer",
  "Microwave",
  "Oven / Range",
  "Freezer",
  "Garbage Disposal",
  "Range Hood",
  "Water Softener",
];

// Multi-select checklist for common appliances — faster than the one-at-a-
// time QuickAddStep flow used for other categories, since there's a known
// common set to just tick off. Each checked item becomes its own system
// (category "appliance", brand = the appliance name).
// How many existing appliance systems already match this common name (the
// bare name itself, or "<name> <n>" for multiples) — used to pre-check the
// box and skip re-adding duplicates if onboarding is restarted partway
// through.
function existingApplianceCount(systems, name) {
  const pattern = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( \\d+)?$`);
  return systems.filter((s) => s.category === "appliance" && pattern.test(s.brand || "")).length;
}

function ApplianceChecklistStep({ onBack, onDone }) {
  const insets = useSafeAreaInsets();
  const { systems, addSystem } = useAppData();
  // Presence with a value > 0 means checked; the value is the quantity.
  // Pre-filled from anything already added (e.g. a previous, restarted pass
  // through onboarding) so re-opening this screen doesn't look like a blank
  // slate, and so Continue below doesn't re-add what's already there.
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    for (const name of COMMON_APPLIANCES) {
      const count = existingApplianceCount(systems, name);
      if (count > 0) initial[name] = count;
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  function toggle(name) {
    setQuantities((q) => ({ ...q, [name]: q[name] ? 0 : 1 }));
  }

  function adjustQuantity(name, delta) {
    setQuantities((q) => ({ ...q, [name]: Math.max(0, Math.min(20, (q[name] || 1) + delta)) }));
  }

  const totalCount = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0);

  async function handleContinue() {
    setSaving(true);
    try {
      for (const name of COMMON_APPLIANCES) {
        const qty = quantities[name] || 0;
        for (let i = 0; i < qty; i++) {
          const brand = qty > 1 ? `${name} ${i + 1}` : name;
          if (systems.some((s) => s.category === "appliance" && s.brand === brand)) continue;
          await addSystem({ category: "appliance", brand, model: null, location: "" });
        }
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Back</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Which appliances do you have?</Text>
      <Text className="text-[12.5px] text-stone-500 mb-4">
        Check off anything you&apos;d like to add, and bump the quantity if you have more than one — you can fill in brand and details for each later.
      </Text>

      <View className="rounded-xl bg-white px-3 mb-6" style={fieldStyle}>
        {COMMON_APPLIANCES.map((name, i) => {
          const qty = quantities[name] || 0;
          const isChecked = qty > 0;
          return (
            <View
              key={name}
              className="flex-row items-center justify-between py-2.5"
              style={{ borderBottomWidth: i < COMMON_APPLIANCES.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              <Pressable onPress={() => toggle(name)} className="flex-row items-center gap-2 flex-1 py-1" hitSlop={4}>
                <View
                  className="items-center justify-center rounded"
                  style={{ width: 20, height: 20, backgroundColor: isChecked ? PRIMARY : "white", borderWidth: isChecked ? 0 : 1, borderColor: "#D8D5CB" }}
                >
                  {isChecked && <Check size={14} color="white" />}
                </View>
                <Text className="text-[13.5px] text-stone-800">{name}</Text>
              </Pressable>

              {isChecked && (
                <View className="flex-row items-center rounded-lg" style={fieldStyle}>
                  <Pressable onPress={() => adjustQuantity(name, -1)} className="items-center justify-center" style={{ width: 28, height: 30 }} hitSlop={6}>
                    <Minus size={13} color={PRIMARY} />
                  </Pressable>
                  <Text className="text-[13px] font-semibold text-center" style={{ width: 18 }}>{qty}</Text>
                  <Pressable onPress={() => adjustQuantity(name, 1)} className="items-center justify-center" style={{ width: 28, height: 30 }} hitSlop={6}>
                    <Plus size={13} color={PRIMARY} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={handleContinue}
        disabled={saving}
        className="w-full py-2.5 rounded-lg items-center"
        style={{ backgroundColor: PRIMARY, opacity: saving ? 0.6 : 1 }}
      >
        <Text className="text-[13.5px] font-semibold text-white">
          {saving ? "Saving..." : totalCount > 0 ? `Add ${totalCount} and continue` : "Continue"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// Same shape as HvacOnboardingStep/WaterHeaterOnboardingStep above, for
// backup generators. Nothing RentCast would have pre-detected, but if a
// generator already exists (e.g. onboarding was restarted after this step
// was already completed once), skip straight past "do you have one?".
function GeneratorOnboardingStep({ onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const hasExisting = systems.some((s) => s.category === "generator");
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function applyGeneratorType(typeKey) {
    setSaving(true);
    setError("");
    try {
      await applySystemUnits(GENERATOR_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function answerGuide(yes) {
    const node = GENERATOR_GUIDE_TREE[guideNode];
    const next = yes ? node.yes : node.no;
    if (GENERATOR_GUIDE_TREE[next]) {
      setGuideHistory((h) => [...h, guideNode]);
      setGuideNode(next);
    } else {
      setSuggestedType(next);
      setSubStep("pick");
    }
  }

  function backGuide() {
    if (guideHistory.length === 0) {
      setSubStep("know");
      return;
    }
    setGuideNode(guideHistory[guideHistory.length - 1]);
    setGuideHistory((h) => h.slice(0, -1));
  }

  const Icon = CATEGORY_META.generator.icon;
  const guideScreenProps = { title: "Let's add your backup generator", skipSubject: "the generator" };

  if (subStep === "ask") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={onBack} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you have a backup power generator?</Text>
        <Pressable onPress={() => setSubStep("know")} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={onDone} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No, I don&apos;t have one</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "know") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={hasExisting ? onBack : () => setSubStep("ask")} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you know your generator type?</Text>
        <Pressable
          onPress={() => { setSuggestedType(null); setSubStep("pick"); }}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { setGuideNode("start"); setGuideHistory([]); setSubStep("guide"); }}
          className="w-full py-2.5 rounded-lg items-center"
          style={fieldStyle}
        >
          <Text className="text-[13.5px] font-semibold text-stone-700">Guide me</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "guide") {
    const node = GENERATOR_GUIDE_TREE[guideNode];
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={backGuide} onSkip={onDone}>
        <GeneratorGuideIllustration guideKey={guideNode} />
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{node.text}</Text>
        <Pressable onPress={() => answerGuide(true)} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={() => answerGuide(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  // subStep === "pick"
  return (
    <OnboardingGuideScreen {...guideScreenProps} onBackPress={() => setSubStep("know")} onSkip={onDone}>
      <Text className="text-[12.5px] text-stone-500 mb-3 text-center">
        {suggestedType ? "Based on your answers, this looks like your setup — tap to confirm, or pick a different one." : "Which best describes your generator?"}
      </Text>
      <TypePickerList types={GENERATOR_TYPES} suggestedKey={suggestedType} onSelect={applyGeneratorType} saving={saving} Icon={Icon} />
      {error && <Text className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
    </OnboardingGuideScreen>
  );
}

// Same shape as GeneratorOnboardingStep above, for solar panels.
function SolarOnboardingStep({ onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const hasExisting = systems.some((s) => s.category === "solar");
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function applySolarType(typeKey) {
    setSaving(true);
    setError("");
    try {
      await applySystemUnits(SOLAR_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function answerGuide(yes) {
    const node = SOLAR_GUIDE_TREE[guideNode];
    const next = yes ? node.yes : node.no;
    if (SOLAR_GUIDE_TREE[next]) {
      setGuideHistory((h) => [...h, guideNode]);
      setGuideNode(next);
    } else {
      setSuggestedType(next);
      setSubStep("pick");
    }
  }

  function backGuide() {
    if (guideHistory.length === 0) {
      setSubStep("know");
      return;
    }
    setGuideNode(guideHistory[guideHistory.length - 1]);
    setGuideHistory((h) => h.slice(0, -1));
  }

  const Icon = CATEGORY_META.solar.icon;
  const guideScreenProps = { title: "Let's add your solar panels", skipSubject: "solar panels" };

  if (subStep === "ask") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={onBack} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you have solar panels?</Text>
        <Pressable onPress={() => setSubStep("know")} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={onDone} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No, I don&apos;t have any</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "know") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={hasExisting ? onBack : () => setSubStep("ask")} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you know how they&apos;re installed?</Text>
        <Pressable
          onPress={() => { setSuggestedType(null); setSubStep("pick"); }}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { setGuideNode("start"); setGuideHistory([]); setSubStep("guide"); }}
          className="w-full py-2.5 rounded-lg items-center"
          style={fieldStyle}
        >
          <Text className="text-[13.5px] font-semibold text-stone-700">Guide me</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "guide") {
    const node = SOLAR_GUIDE_TREE[guideNode];
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={backGuide} onSkip={onDone}>
        <SolarGuideIllustration guideKey={guideNode} />
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{node.text}</Text>
        <Pressable onPress={() => answerGuide(true)} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={() => answerGuide(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  // subStep === "pick"
  return (
    <OnboardingGuideScreen {...guideScreenProps} onBackPress={() => setSubStep("know")} onSkip={onDone}>
      <Text className="text-[12.5px] text-stone-500 mb-3 text-center">
        {suggestedType ? "Based on your answers, this looks like your setup — tap to confirm, or pick a different one." : "Which best describes your installation?"}
      </Text>
      <TypePickerList types={SOLAR_TYPES} suggestedKey={suggestedType} onSelect={applySolarType} saving={saving} Icon={Icon} />
      {error && <Text className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
    </OnboardingGuideScreen>
  );
}

// Same shape as SolarOnboardingStep above, for EV chargers.
function EvChargerOnboardingStep({ onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const hasExisting = systems.some((s) => s.category === "ev_charger");
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function applyEvChargerType(typeKey) {
    setSaving(true);
    setError("");
    try {
      await applySystemUnits(EV_CHARGER_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function answerGuide(yes) {
    const node = EV_CHARGER_GUIDE_TREE[guideNode];
    const next = yes ? node.yes : node.no;
    if (EV_CHARGER_GUIDE_TREE[next]) {
      setGuideHistory((h) => [...h, guideNode]);
      setGuideNode(next);
    } else {
      setSuggestedType(next);
      setSubStep("pick");
    }
  }

  function backGuide() {
    if (guideHistory.length === 0) {
      setSubStep("know");
      return;
    }
    setGuideNode(guideHistory[guideHistory.length - 1]);
    setGuideHistory((h) => h.slice(0, -1));
  }

  const Icon = CATEGORY_META.ev_charger.icon;
  const guideScreenProps = { title: "Let's add your EV charger", skipSubject: "the EV charger" };

  if (subStep === "ask") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={onBack} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you have an EV charger?</Text>
        <Pressable onPress={() => setSubStep("know")} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={onDone} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No, I don&apos;t have one</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "know") {
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={hasExisting ? onBack : () => setSubStep("ask")} onSkip={onDone}>
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">Do you know if it&apos;s Level 1 or Level 2?</Text>
        <Pressable
          onPress={() => { setSuggestedType(null); setSubStep("pick"); }}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => { setGuideNode("start"); setGuideHistory([]); setSubStep("guide"); }}
          className="w-full py-2.5 rounded-lg items-center"
          style={fieldStyle}
        >
          <Text className="text-[13.5px] font-semibold text-stone-700">Guide me</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  if (subStep === "guide") {
    const node = EV_CHARGER_GUIDE_TREE[guideNode];
    return (
      <OnboardingGuideScreen {...guideScreenProps} onBackPress={backGuide} onSkip={onDone}>
        <EvChargerGuideIllustration guideKey={guideNode} />
        <Text className="text-[13.5px] text-stone-700 mb-4 text-center">{node.text}</Text>
        <Pressable onPress={() => answerGuide(true)} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[13.5px] font-semibold text-white">Yes</Text>
        </Pressable>
        <Pressable onPress={() => answerGuide(false)} className="w-full py-2.5 rounded-lg items-center" style={fieldStyle}>
          <Text className="text-[13.5px] font-semibold text-stone-700">No</Text>
        </Pressable>
      </OnboardingGuideScreen>
    );
  }

  // subStep === "pick"
  return (
    <OnboardingGuideScreen {...guideScreenProps} onBackPress={() => setSubStep("know")} onSkip={onDone}>
      <Text className="text-[12.5px] text-stone-500 mb-3 text-center">
        {suggestedType ? "Based on your answers, this looks like your setup — tap to confirm, or pick a different one." : "Which best describes your charger?"}
      </Text>
      <TypePickerList types={EV_CHARGER_TYPES} suggestedKey={suggestedType} onSelect={applyEvChargerType} saving={saving} Icon={Icon} />
      {error && <Text className="text-[12px] text-center" style={{ color: STATUS_COLOR.red }}>{error}</Text>}
    </OnboardingGuideScreen>
  );
}

export default function OnboardingScreen() {
  const { saveProfile, systems } = useAppData();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState("welcome");
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const [bedrooms, setBedrooms] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [extraDetails, setExtraDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [activeSystemId, setActiveSystemId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (step !== "transition") return;
    const timer = setTimeout(() => setStep("property"), 1600);
    return () => clearTimeout(timer);
  }, [step]);

  function openSystemDetails(sys) {
    setActiveSystemId(sys.id);
    setStep("fill-details");
  }

  function goToSystemsOverview() {
    if (systems.length === 0) {
      finishOnboarding();
      return;
    }
    setStep("systems-overview");
  }

  function handleAddressChange(text) {
    setAddress(text);
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      try {
        const results = await autocompleteAddress(text);
        if (requestId === requestIdRef.current) setSuggestions(results);
      } catch {
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
          setError("Couldn't load address suggestions — check your internet connection. You can still continue and fill in details manually.");
        }
      } finally {
        if (requestId === requestIdRef.current) setSearching(false);
      }
    }, 300);
  }

  function selectSuggestion(suggestion) {
    // Just fills in the text field — the actual (quota-limited) lookup only
    // happens when the user explicitly taps "Find property details" below,
    // so tapping the wrong suggestion and correcting it costs nothing.
    setAddress(suggestion.formattedAddress);
    setSuggestions([]);
  }

  async function handleFindDetails() {
    setDetailsLoading(true);
    setError("");
    setStep("searching");

    // Keep the "Searching..." transition up for at least this long, so a
    // fast response doesn't just flash the screen and skip past it.
    const MIN_SEARCH_MS = 2000;
    const start = Date.now();
    let details, fetchError;
    try {
      details = await fetchPropertyDetails(address);
    } catch (err) {
      fetchError = err;
    }
    const remaining = MIN_SEARCH_MS - (Date.now() - start);
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));

    if (fetchError) {
      setError("Couldn't look up that address. You can still continue and fill in details manually.");
      setExtraDetails({});
    } else {
      if (details.bedrooms != null) setBedrooms(String(details.bedrooms));
      if (details.yearBuilt != null) setYearBuilt(String(details.yearBuilt));
      if (details.purchasePrice != null) setPurchasePrice(String(details.purchasePrice));
      if (details.marketValue != null) setMarketValue(String(Math.round(details.marketValue)));
      setExtraDetails(details);
    }
    setStep("review");
    setDetailsLoading(false);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const num = (s) => (s.trim() ? parseFloat(s) : null);
      const int = (s) => (s.trim() ? parseInt(s, 10) : null);
      await saveProfile({
        propertyName: propertyName.trim(),
        address: address.trim(),
        bedrooms: int(bedrooms),
        yearBuilt: int(yearBuilt),
        purchasePrice: num(purchasePrice),
        propertyValue: num(marketValue),
        propertyValueSource: marketValue.trim() ? "RentCast" : null,
        bathrooms: extraDetails?.bathrooms ?? null,
        squareFootage: extraDetails?.squareFootage ?? null,
        lotSize: extraDetails?.lotSize ?? null,
        propertyType: extraDetails?.propertyType ?? null,
        roomCount: extraDetails?.roomCount ?? null,
        floorCount: extraDetails?.floorCount ?? null,
        roofType: extraDetails?.roofType ?? null,
        heatingType: extraDetails?.heatingType ?? null,
        coolingType: extraDetails?.coolingType ?? null,
        foundationType: extraDetails?.foundationType ?? null,
        exteriorType: extraDetails?.exteriorType ?? null,
        architectureType: extraDetails?.architectureType ?? null,
        hasGarage: extraDetails?.hasGarage ?? null,
        garageType: extraDetails?.garageType ?? null,
        garageSpaces: extraDetails?.garageSpaces ?? null,
        hasPool: extraDetails?.hasPool ?? null,
        poolType: extraDetails?.poolType ?? null,
        hasFireplace: extraDetails?.hasFireplace ?? null,
        fireplaceType: extraDetails?.fireplaceType ?? null,
        hoaFee: extraDetails?.hoaFee ?? null,
      });
      setStep("hvac");
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function finishOnboarding() {
    await saveProfile({ onboardingCompleted: true });
  }

  if (step === "welcome") {
    return (
      <LinearGradient colors={[HERO_BG_TOP, HERO_BG_BOTTOM]} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-1 px-8 justify-center items-center">
          <View
            className="rounded-full items-center justify-center mb-8"
            style={{ width: 148, height: 148, backgroundColor: "rgba(255,255,255,0.5)" }}
          >
            <View className="rounded-full items-center justify-center bg-white" style={{ width: 100, height: 100 }}>
              <Image source={require("../../assets/logo.png")} style={{ width: 66, height: 62 }} resizeMode="contain" />
            </View>
          </View>

          <Text className="text-[30px] font-bold text-center mb-3" style={{ color: PRIMARY, lineHeight: 36 }}>
            Welcome to{"\n"}MyHome OS
          </Text>
          <Text className="text-[15px] text-center mb-10 px-2" style={{ color: "#3B5169", lineHeight: 22 }}>
            Let&apos;s set up your property so we can start tracking its systems, tasks, and costs — all in one place.
          </Text>

          <Pressable
            onPress={() => setStep("transition")}
            className="w-full py-4 rounded-full items-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-[15px] font-semibold text-white">Get started</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  if (step === "transition") {
    return <OnboardingTransition image={require("../../assets/logo.png")} message="Let's get your home managed in one place" />;
  }

  if (step === "searching") {
    return <OnboardingTransition icon={Search} message="Searching for your beautiful home details..." />;
  }

  if (step === "property") {
    const canFindDetails = propertyName.trim() && address.trim() && !detailsLoading;
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Add your property</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">
          We&apos;ll look up its details on the next step, once you&apos;ve confirmed the address.
        </Text>

        <Text className="text-[11px] text-stone-500 mb-1">Property name</Text>
        <TextInput
          value={propertyName}
          onChangeText={setPropertyName}
          placeholder="e.g. Main House, The Lake House"
          className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
          style={fieldStyle}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />

        <Text className="text-[11px] text-stone-500 mb-1">Address</Text>
        <TextInput
          value={address}
          onChangeText={handleAddressChange}
          placeholder="Start typing your address..."
          className="w-full px-3 py-2 rounded-lg text-[13.5px]"
          style={fieldStyle}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />

        {searching && (
          <View className="mt-2">
            <ActivityIndicator size="small" color={PRIMARY} />
          </View>
        )}

        {suggestions.length > 0 && (
          <View className="rounded-lg bg-white mt-2 mb-3" style={fieldStyle}>
            {suggestions.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => selectSuggestion(s)}
                className="flex-row items-center gap-2 px-3 py-2.5"
                style={{ borderBottomWidth: i < suggestions.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <MapPin size={14} color="#78716c" />
                <Text className="text-[13px] text-stone-700 flex-1" numberOfLines={2}>{s.formattedAddress}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!suggestions.length && <View className="mb-3" />}

        {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

        <Pressable
          onPress={handleFindDetails}
          disabled={!canFindDetails}
          className="w-full py-2.5 rounded-lg items-center"
          style={{ backgroundColor: PRIMARY, opacity: canFindDetails ? 1 : 0.5 }}
        >
          <Text className="text-[13.5px] font-semibold text-white">Find property details</Text>
        </Pressable>
      </ScrollView>
      <KeyboardDoneBar />
      </KeyboardAvoidingView>
    );
  }

  if (step === "hvac") {
    const hasExistingHvac = systems.some((s) => s.category === "hvac_indoor" || s.category === "hvac_outdoor");
    return (
      <HvacOnboardingStep
        hasExisting={hasExistingHvac}
        onBack={() => setStep("review")}
        onDone={() => setStep("water-heater")}
      />
    );
  }

  if (step === "water-heater") {
    const hasExistingWaterHeater = systems.some((s) => s.category === "water_heater");
    return (
      <WaterHeaterOnboardingStep
        hasExisting={hasExistingWaterHeater}
        onBack={() => setStep("hvac")}
        onDone={() => setStep("plumbing-fixtures-ask")}
      />
    );
  }

  if (step === "plumbing-fixtures-ask") {
    return (
      <YesNoPrompt
        title="Add plumbing fixtures?"
        question="Would you like to add toilets, faucets, or sinks?"
        onBack={() => setStep("water-heater")}
        onYes={() => setStep("plumbing-fixtures-add")}
        onNo={() => setStep("generator")}
      />
    );
  }

  if (step === "plumbing-fixtures-add") {
    return (
      <QuickAddStep
        key="plumbing-fixtures-add"
        title="Add your fixtures"
        subtitle="Toilets, faucets, sinks — add as many as you have, one at a time."
        categories={ONBOARDING_FIXTURE_CATEGORIES}
        doneLabel="Done with fixtures"
        onDone={() => setStep("generator")}
        onBack={() => setStep("plumbing-fixtures-ask")}
        backLabel="Back"
      />
    );
  }

  if (step === "generator") {
    return (
      <GeneratorOnboardingStep
        onBack={() => setStep("plumbing-fixtures-ask")}
        onDone={() => setStep("solar")}
      />
    );
  }

  if (step === "solar") {
    return (
      <SolarOnboardingStep
        onBack={() => setStep("generator")}
        onDone={() => setStep("ev-charger")}
      />
    );
  }

  if (step === "ev-charger") {
    return (
      <EvChargerOnboardingStep
        onBack={() => setStep("solar")}
        onDone={() => setStep("appliances-ask")}
      />
    );
  }

  if (step === "appliances-ask") {
    return (
      <YesNoPrompt
        title="Add appliances?"
        question="Would you like to add your appliances?"
        onBack={() => setStep("ev-charger")}
        onYes={() => setStep("appliances-checklist")}
        onNo={goToSystemsOverview}
      />
    );
  }

  if (step === "appliances-checklist") {
    return (
      <ApplianceChecklistStep
        onBack={() => setStep("appliances-ask")}
        onDone={goToSystemsOverview}
      />
    );
  }

  if (step === "systems-overview") {
    return <SystemsOverviewStep systems={systems} onSelect={openSystemDetails} onFinish={finishOnboarding} />;
  }

  if (step === "fill-details") {
    const currentSystem = systems.find((s) => s.id === activeSystemId);
    // Defensive: the active system shouldn't be able to disappear mid-step
    // during normal use, but if it somehow did, just show the overview
    // again instead of getting stuck on a missing system.
    if (!currentSystem) {
      return <SystemsOverviewStep systems={systems} onSelect={openSystemDetails} onFinish={finishOnboarding} />;
    }
    return (
      <SystemDetailsStep
        key={currentSystem.id}
        system={currentSystem}
        onDone={() => setStep("systems-overview")}
      />
    );
  }

  // step === "review"
  const featureChips = extraDetails ? buildFeatureSummary(extraDetails) : [];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
    <ScrollView
      className="flex-1 bg-[#F5F8F0] px-4"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => setStep("property")} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Back</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-1">{propertyName}</Text>
      <Text className="text-[12.5px] text-stone-500 mb-3">{address}</Text>

      {featureChips.length > 0 && (
        <View className="mb-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: ACCENT_YELLOW }}>
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <Sparkles size={13} color={PRIMARY} />
            <Text className="text-[11.5px] font-semibold" style={{ color: PRIMARY }}>
              Auto-filled from public records — review and edit anything below
            </Text>
          </View>
          <Text className="text-[11.5px]" style={{ color: PRIMARY }}>{featureChips.join(" · ")}</Text>
        </View>
      )}

      <View className="flex-row gap-2 mb-2">
        <View className="flex-1">
          <Text className="text-[11px] text-stone-500 mb-1">Bedrooms</Text>
          <TextInput
            value={bedrooms}
            onChangeText={setBedrooms}
            placeholder="e.g. 3"
            inputMode="numeric"
            className="w-full px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
        </View>
        <View className="flex-1">
          <Text className="text-[11px] text-stone-500 mb-1">Year built</Text>
          <TextInput
            value={yearBuilt}
            onChangeText={setYearBuilt}
            placeholder="e.g. 1998"
            inputMode="numeric"
            className="w-full px-3 py-2 rounded-lg text-[13.5px]"
            style={fieldStyle}
            inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
          />
        </View>
      </View>

      <Text className="text-[11px] text-stone-500 mb-1">Purchase price ($)</Text>
      <TextInput
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        placeholder="e.g. 350000"
        inputMode="decimal"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />

      <Text className="text-[11px] text-stone-500 mb-1">Current market value ($)</Text>
      <TextInput
        value={marketValue}
        onChangeText={setMarketValue}
        placeholder="e.g. 425000"
        inputMode="decimal"
        className="w-full mb-4 px-3 py-2 rounded-lg text-[13.5px]"
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        style={fieldStyle}
      />

      {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-lg items-center"
        style={{ backgroundColor: PRIMARY, opacity: saving ? 0.6 : 1 }}
      >
        <Text className="text-[13.5px] font-semibold text-white">{saving ? "Saving..." : "Continue"}</Text>
      </Pressable>
    </ScrollView>
    <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}
