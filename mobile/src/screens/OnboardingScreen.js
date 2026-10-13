import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { MapPin, Sparkles, ChevronLeft, ChevronRight, Check, Search, X, Plus, Minus, List } from "lucide-react-native";
import {
  PRIMARY,
  HERO_BG_TOP,
  HERO_BG_BOTTOM,
  ACCENT_YELLOW,
  STATUS_COLOR,
  STATUS_BG,
  CATEGORY_META,
  ONBOARDING_SYSTEM_CATEGORIES,
  ONBOARDING_STRUCTURE_CATEGORIES,
} from "../lib/constants.js";
import { autocompleteAddress } from "../lib/mapbox.js";
import { fetchPropertyDetails, scanSystemLabel } from "../lib/db.js";
import { buildFeatureSummary } from "../lib/propertyFeatures.js";
import { useAppData } from "../lib/app-data-context.js";
import OnboardingTransition from "../components/OnboardingTransition.js";
import KeyboardDoneBar, { KEYBOARD_ACCESSORY_ID } from "../components/KeyboardDoneBar.js";
import ItemFields from "../components/ItemFields.js";
import PhotoPicker from "../components/PhotoPicker.js";
import HvacGuideIllustration from "../components/HvacGuideIllustrations.js";
import WaterHeaterGuideIllustration from "../components/WaterHeaterGuideIllustrations.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };
const pickerBoxStyle = { borderWidth: 1, borderColor: "#E0E8D3", borderRadius: 8, overflow: "hidden" };

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
          <View className="rounded-xl bg-white px-3 mb-4" style={fieldStyle}>
            {added.map((sys, i) => {
              const meta = CATEGORY_META[sys.category];
              const Icon = meta.icon;
              return (
                <View
                  key={sys.id}
                  className="flex-row items-center justify-between py-2.5"
                  style={{ borderBottomWidth: i < added.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <Icon size={16} color="#5F5B50" />
                    <Text className="text-[13.5px] text-stone-800 flex-1">
                      {sys.brand ? sys.brand : meta.label}
                    </Text>
                  </View>
                  <Pressable onPress={() => deleteSystem(sys.id)} hitSlop={8}>
                    <X size={16} color="#B8B4A8" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {!fixedCategory && (
          <>
            <Text className="text-[11px] text-stone-500 mb-1">Category</Text>
            <View className="w-full mb-2" style={pickerBoxStyle}>
              <Picker selectedValue={category} onValueChange={setCategory}>
                {categories.map((key) => (
                  <Picker.Item key={key} label={CATEGORY_META[key].label} value={key} />
                ))}
              </Picker>
            </View>
          </>
        )}

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1">
            <Text className="text-[11px] text-stone-500 mb-1">Name (optional)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={fixedCategory ? "e.g. Refrigerator, Dishwasher" : "e.g. Carrier, Front windows"}
              className="w-full px-3 py-2 rounded-lg text-[13.5px]"
              style={fieldStyle}
              inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
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

        {addError && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{addError}</Text>}

        <Pressable
          onPress={handleAdd}
          disabled={adding}
          className="w-full py-2.5 rounded-lg items-center flex-row justify-center gap-1.5 mb-6"
          style={{ borderWidth: 1, borderColor: PRIMARY, opacity: adding ? 0.6 : 1 }}
        >
          <Plus size={15} color={PRIMARY} />
          <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>
            {quantity > 1 ? `Add ${quantity}` : "Add"}
          </Text>
        </Pressable>

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

// Full-screen list of every system in the current details-walkthrough queue,
// so the user can jump to any of them — forward or backward — instead of
// only ever moving to the next one.
function SystemsListModal({ queue, systems, currentIndex, onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Pressable
        onPress={onClose}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
      />
      <View
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl px-4"
        style={{ maxHeight: "75%", paddingTop: 16, paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[15px] font-semibold text-stone-900">Your systems</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color="#78716c" />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {queue.map((id, i) => {
            const sys = systems.find((s) => s.id === id);
            if (!sys) return null;
            const meta = CATEGORY_META[sys.category];
            const Icon = meta.icon;
            const done = systemHasDetails(sys);
            const isCurrent = i === currentIndex;
            return (
              <Pressable
                key={id}
                onPress={() => onSelect(i)}
                className="flex-row items-center justify-between py-2.5 px-2 rounded-lg"
                style={{
                  borderBottomWidth: i < queue.length - 1 ? 1 : 0,
                  borderBottomColor: "#E7EEDB",
                  backgroundColor: isCurrent ? "#F5F8F0" : "transparent",
                }}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Icon size={16} color="#5F5B50" />
                  <Text className="text-[13.5px] text-stone-800 flex-1" numberOfLines={1}>
                    {sys.brand ? sys.brand : meta.label}
                  </Text>
                </View>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: done ? STATUS_BG.green : "#F2F0EA" }}>
                  <Text className="text-[10.5px] font-semibold" style={{ color: done ? STATUS_COLOR.green : "#9C9890" }}>
                    {done ? "Completed" : "Not started"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// Walks the user through one just-added item at a time: take a photo (AI
// auto-fill, same scanSystemLabel flow as the regular Add/Edit System form)
// or fill it in manually, then move on. Nothing here is required — Save
// keeps whatever was filled in (even partial), and Skip moves on with no
// changes at all, so this never blocks finishing onboarding.
function SystemDetailsStep({ system, index, total, onNext, onShowList }) {
  const insets = useSafeAreaInsets();
  const { updateSystem, attachManualDocument, addDocument } = useAppData();
  const isStructure = ONBOARDING_STRUCTURE_CATEGORIES.includes(system.category);

  // Guides the user through: 1) a photo (label for systems/appliances, a
  // condition photo for structure items) which auto-fills from the label
  // when possible, 2) an optional receipt/warranty photo, 3) the rest of
  // the fields, pre-filled from the scan where available.
  const [subStep, setSubStep] = useState("photo");

  const [photoUrl, setPhotoUrl] = useState(system.photoUrl || "");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState("");
  const [receiptType, setReceiptType] = useState("Receipt");

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
  const [sysFilterSize, setSysFilterSize] = useState(system.filterSize || "");
  const [sysManualUrl, setSysManualUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = CATEGORY_META[system.category];
  const isLast = index + 1 === total;

  async function runScan() {
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
        setScanError("Couldn't read the label clearly. You can fill in the fields manually.");
      }
    } catch {
      setScanError("AI scan failed. You can fill in the fields manually.");
    } finally {
      setScanning(false);
    }
  }

  async function handlePhotoContinue() {
    // Only auto-scan the first time — avoids re-scanning (and re-billing
    // the API) when revisiting an already-filled-in system via the list.
    if (photoUrl && !isStructure && !sysBrand && !sysModel) {
      await runScan();
    }
    setSubStep("receipt");
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
        photoUrl: photoUrl || null,
        filterSize: sysCategory === "hvac_indoor" ? sysFilterSize || null : null,
      });
      if (sysManualUrl && updated) {
        await attachManualDocument(updated.id, updated.brand, updated.model, sysManualUrl);
      }
      if (receiptPhotoUrl && updated) {
        await addDocument(`${updated.brand || meta.label} ${receiptType}`, receiptType, updated.id, receiptPhotoUrl);
      }
      onNext();
    } catch {
      setError("Couldn't save. You can try again or skip for now.");
    } finally {
      setSaving(false);
    }
  }

  const topBar = (
    <View className="flex-row items-center justify-between mb-1">
      <Text className="text-[12px] text-stone-400">Item {index + 1} of {total}</Text>
      <Pressable onPress={onShowList} className="flex-row items-center gap-1" hitSlop={8}>
        <List size={14} color={PRIMARY} />
        <Text className="text-[12px] font-semibold" style={{ color: PRIMARY }}>Systems list</Text>
      </Pressable>
    </View>
  );

  if (subStep === "photo") {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1 bg-[#F5F8F0] px-4"
          contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {topBar}
          <Text className="text-[17px] font-semibold text-stone-900 mb-1">
            {isStructure ? `Add a picture of its condition (${meta.label})` : `Take a picture of the ${meta.label} label`}
          </Text>
          <Text className="text-[12.5px] text-stone-500 mb-4">
            {isStructure
              ? "This helps you track its condition over time. You can skip if you don't have one handy."
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
            className="w-full py-2.5 rounded-lg items-center"
            style={{ backgroundColor: PRIMARY, opacity: scanning ? 0.6 : 1 }}
          >
            <Text className="text-[13.5px] font-semibold text-white">
              {photoUrl ? "Continue" : "Skip, I don't have a picture"}
            </Text>
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
          {topBar}
          <Pressable onPress={() => setSubStep("photo")} className="flex-row items-center gap-1 mb-3">
            <ChevronLeft size={16} color="#78716c" />
            <Text className="text-[13px] text-stone-500">Back</Text>
          </Pressable>

          <Text className="text-[17px] font-semibold text-stone-900 mb-1">
            {isStructure ? "Add a receipt photo?" : "Add a receipt or warranty photo?"}
          </Text>
          <Text className="text-[12.5px] text-stone-500 mb-4">
            {isStructure
              ? "If you have a receipt from a repair or installation, add it here. Optional, if applicable."
              : "If you have one, we'll save it with this system's documents. Optional."}
          </Text>

          <PhotoPicker photoUrl={receiptPhotoUrl} onChange={setReceiptPhotoUrl} />

          {receiptPhotoUrl && !isStructure && (
            <View className="flex-row gap-2 mb-4">
              {["Receipt", "Warranty"].map((t) => {
                const selected = receiptType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setReceiptType(t)}
                    className="rounded-full px-3 py-1.5"
                    style={{ backgroundColor: selected ? PRIMARY : "white", borderWidth: selected ? 0 : 1, borderColor: "#D8D5CB" }}
                  >
                    <Text className="text-[12.5px] font-semibold" style={{ color: selected ? "white" : "#5F5B50" }}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={() => setSubStep("fields")}
            className="w-full py-2.5 rounded-lg items-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-[13.5px] font-semibold text-white">
              {receiptPhotoUrl ? "Continue" : "Skip, I don't have one"}
            </Text>
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
        {topBar}
        <Pressable onPress={() => setSubStep("receipt")} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Back</Text>
        </Pressable>

        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Fill in the rest</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">
          {sysBrand || sysModel ? "Auto-filled from the label — review and edit anything below." : "Nothing here is required."}
        </Text>

        {sysManualUrl && (
          <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.green }}>
            Found the owner&apos;s manual — it&apos;ll be attached to this system&apos;s Documents when you save.
          </Text>
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
          sysFilterSize={sysFilterSize} setSysFilterSize={setSysFilterSize}
          sysManualUrl={sysManualUrl} setSysManualUrl={setSysManualUrl}
          hideCategoryPicker
          hidePhotoSection
        />

        {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

        <Pressable
          onPress={handleSaveNext}
          disabled={saving}
          className="w-full py-2.5 rounded-lg items-center mb-2"
          style={{ backgroundColor: PRIMARY, opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-[13.5px] font-semibold text-white">
            {saving ? "Saving..." : isLast ? "Save & finish" : "Save & next"}
          </Text>
        </Pressable>

        <Pressable onPress={onNext} disabled={saving} className="w-full py-2.5 rounded-lg items-center">
          <Text className="text-[13.5px] font-semibold text-stone-500">
            {isLast ? "Skip, I'll add this later" : "Skip, add this later"}
          </Text>
        </Pressable>
      </ScrollView>
      <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}

// The five HVAC configurations we can recognize. Each maps to one or two
// actual system entries (most configurations split into an indoor and an
// outdoor unit) — brand/model are left for the user to fill in later via the
// regular details walkthrough, but the model field gets a descriptive
// placeholder so indoor/outdoor entries stay distinguishable in the list.
const HVAC_TYPES = {
  furnace_ac: {
    label: "Gas Furnace + Central AC",
    hint: "Most common",
    units: [
      { category: "hvac_indoor", model: "Gas furnace" },
      { category: "hvac_outdoor", model: "Central AC condenser" },
    ],
  },
  heat_pump: {
    label: "Central heat pump system",
    units: [
      { category: "hvac_indoor", model: "Heat pump air handler" },
      { category: "hvac_outdoor", model: "Heat pump outdoor unit" },
    ],
  },
  mini_split: {
    label: "Ductless mini split",
    units: [
      { category: "hvac_indoor", model: "Mini split indoor head" },
      { category: "hvac_outdoor", model: "Mini split outdoor compressor" },
    ],
  },
  packaged: {
    label: "Packaged HVAC system",
    units: [{ category: "hvac_outdoor", model: "Packaged HVAC unit" }],
  },
  through_wall: {
    label: "Through-wall AC",
    units: [{ category: "hvac_indoor", model: "Through-wall AC unit" }],
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
// always a single unit — brand/model are left for later, but the model
// field gets a descriptive placeholder.
const WATER_HEATER_TYPES = {
  tank: {
    label: "Conventional Tank Water Heater",
    hint: "Most common",
    units: [{ category: "water_heater", model: "Conventional tank water heater" }],
  },
  tankless: {
    label: "Tankless (On-Demand) Water Heater",
    units: [{ category: "water_heater", model: "Tankless water heater" }],
  },
  heat_pump_wh: {
    label: "Heat Pump (Hybrid) Water Heater",
    units: [{ category: "water_heater", model: "Heat pump (hybrid) water heater" }],
  },
  solar: {
    label: "Solar Water Heater",
    units: [{ category: "water_heater", model: "Solar water heater" }],
  },
  point_of_use: {
    label: "Point-of-Use Water Heater",
    units: [{ category: "water_heater", model: "Point-of-use water heater" }],
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

// Creates/updates the system entries for a chosen type's unit list — shared
// by every guided walkthrough (HVAC, water heater, ...). Reuses a bare
// (brand/model-less) existing system of the matching category when one is
// already there (e.g. from RentCast detection) instead of duplicating it.
async function applySystemUnits(units, { systems, addSystem, updateSystem }) {
  const claimed = new Set();
  for (const unit of units) {
    const existing = systems.find((s) => s.category === unit.category && !s.model && !claimed.has(s.id));
    if (existing) {
      claimed.add(existing.id);
      await updateSystem(existing.id, { model: unit.model });
    } else {
      await addSystem({ category: unit.category, brand: null, model: unit.model, location: "" });
    }
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
// the rest of the systems. If RentCast already detected an HVAC system,
// skips straight to "do you know your type?"; otherwise asks first whether
// there's an HVAC system at all. Every screen can be skipped (with a
// confirmation), since nothing here is required to finish onboarding.
function HvacOnboardingStep({ hasExisting, onBack, onDone }) {
  const { systems, addSystem, updateSystem } = useAppData();
  const [subStep, setSubStep] = useState(hasExisting ? "know" : "ask");
  const [guideNode, setGuideNode] = useState("start");
  const [guideHistory, setGuideHistory] = useState([]);
  const [suggestedType, setSuggestedType] = useState(null);
  const [saving, setSaving] = useState(false);

  async function applyHvacType(typeKey) {
    setSaving(true);
    try {
      await applySystemUnits(HVAC_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
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

  async function applyWaterHeaterType(typeKey) {
    setSaving(true);
    try {
      await applySystemUnits(WATER_HEATER_TYPES[typeKey].units, { systems, addSystem, updateSystem });
      onDone();
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
    </OnboardingGuideScreen>
  );
}

// What we can confidently turn into an actual System entry from RentCast's
// construction/feature data. Only category + a short detected-from label are
// set — brand, model, install date, etc. are left for the user to fill in
// afterward (RentCast has no visibility into which brand's equipment it is).
function buildDetectedSystems(d) {
  const suggestions = [];
  if (d.heatingType || d.coolingType) {
    suggestions.push({
      key: "hvac",
      category: "hvac_indoor",
      description: [d.heatingType && `${d.heatingType} heating`, d.coolingType && `${d.coolingType} cooling`].filter(Boolean).join(", "),
    });
  }
  if (d.roofType) {
    suggestions.push({ key: "roof", category: "roof", description: `${d.roofType} roof` });
  }
  return suggestions;
}

export default function OnboardingScreen() {
  const { saveProfile, addSystem, systems } = useAppData();
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
  const [detectedSystems, setDetectedSystems] = useState([]);
  const [confirmedSystems, setConfirmedSystems] = useState({});

  const [detailQueue, setDetailQueue] = useState([]);
  const [detailIndex, setDetailIndex] = useState(0);
  const [showSystemsList, setShowSystemsList] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (step !== "transition") return;
    const timer = setTimeout(() => setStep("property"), 1600);
    return () => clearTimeout(timer);
  }, [step]);

  // Defensive: if the current queued item somehow no longer exists (it
  // shouldn't during normal use), just skip past it instead of getting
  // stuck on a missing system.
  useEffect(() => {
    if (step !== "fill-details") return;
    const currentId = detailQueue[detailIndex];
    if (currentId && !systems.find((s) => s.id === currentId)) {
      advanceDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, detailIndex, systems]);

  function beginDetailsWalkthrough() {
    const queue = systems.map((s) => s.id);
    if (queue.length === 0) {
      finishOnboarding();
      return;
    }
    setDetailQueue(queue);
    setDetailIndex(0);
    setStep("fill-details");
  }

  function advanceDetails() {
    if (detailIndex + 1 >= detailQueue.length) {
      finishOnboarding();
    } else {
      setDetailIndex((i) => i + 1);
    }
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
      setDetectedSystems([]);
    } else {
      if (details.bedrooms != null) setBedrooms(String(details.bedrooms));
      if (details.yearBuilt != null) setYearBuilt(String(details.yearBuilt));
      if (details.purchasePrice != null) setPurchasePrice(String(details.purchasePrice));
      if (details.marketValue != null) setMarketValue(String(Math.round(details.marketValue)));
      setExtraDetails(details);
      const detected = buildDetectedSystems(details);
      setDetectedSystems(detected);
      setConfirmedSystems(Object.fromEntries(detected.map((s) => [s.key, true])));
    }
    setStep("review");
    setDetailsLoading(false);
  }

  function toggleDetectedSystem(key) {
    setConfirmedSystems((c) => ({ ...c, [key]: !c[key] }));
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
      for (const sys of detectedSystems) {
        if (!confirmedSystems[sys.key]) continue;
        await addSystem({ category: sys.category, brand: null, model: null, location: "" });
      }
      // Clear these so navigating back to this step and tapping Continue
      // again (now possible via the add-steps' back buttons) doesn't
      // re-create the same detected systems a second time.
      setDetectedSystems([]);
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
        onDone={() => setStep("add-systems")}
      />
    );
  }

  if (step === "add-systems") {
    return (
      <QuickAddStep
        key="add-systems"
        title="Add your other systems"
        subtitle="Plumbing, electrical — add anything else you'd like to track. You can skip this and add them later from the Systems tab."
        categories={ONBOARDING_SYSTEM_CATEGORIES.filter((c) => c !== "hvac_indoor" && c !== "hvac_outdoor" && c !== "water_heater")}
        doneLabel="Done with systems"
        onDone={() => setStep("add-appliances")}
        onBack={() => setStep("water-heater")}
        backLabel="Back"
      />
    );
  }

  if (step === "add-appliances") {
    return (
      <QuickAddStep
        key="add-appliances"
        title="Add your appliances"
        subtitle="Refrigerator, dishwasher, washer, dryer — add them one by one, or skip and add them later."
        fixedCategory="appliance"
        doneLabel="Done with appliances"
        onDone={() => setStep("add-structure")}
        onBack={() => setStep("add-systems")}
        backLabel="Back to systems"
      />
    );
  }

  if (step === "add-structure") {
    return (
      <QuickAddStep
        key="add-structure"
        title="Add your house structure"
        subtitle="Roof, windows, exterior/paint, balcony, deck, garden — anything about the structure itself worth tracking."
        categories={ONBOARDING_STRUCTURE_CATEGORIES}
        doneLabel="Continue"
        onDone={beginDetailsWalkthrough}
        onBack={() => setStep("add-appliances")}
        backLabel="Back to appliances"
      />
    );
  }

  if (step === "fill-details") {
    const currentId = detailQueue[detailIndex];
    const currentSystem = systems.find((s) => s.id === currentId);
    if (!currentSystem) return null;
    return (
      <View style={{ flex: 1 }}>
        <SystemDetailsStep
          key={currentSystem.id}
          system={currentSystem}
          index={detailIndex}
          total={detailQueue.length}
          onNext={advanceDetails}
          onShowList={() => setShowSystemsList(true)}
        />
        {showSystemsList && (
          <SystemsListModal
            queue={detailQueue}
            systems={systems}
            currentIndex={detailIndex}
            onSelect={(i) => {
              setDetailIndex(i);
              setShowSystemsList(false);
            }}
            onClose={() => setShowSystemsList(false)}
          />
        )}
      </View>
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

      {detectedSystems.length > 0 && (
        <>
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Detected systems</Text>
          <Text className="text-[11.5px] text-stone-500 mb-2">
            We&apos;ll add these to your Systems tab. You can fill in brand, model, and the rest afterward.
          </Text>
          <View className="rounded-xl bg-white px-3 mb-4" style={fieldStyle}>
            {detectedSystems.map((sys, i) => {
              const meta = CATEGORY_META[sys.category];
              const Icon = meta.icon;
              const checked = !!confirmedSystems[sys.key];
              return (
                <Pressable
                  key={sys.key}
                  onPress={() => toggleDetectedSystem(sys.key)}
                  className="flex-row items-center justify-between py-2.5"
                  style={{ borderBottomWidth: i < detectedSystems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  <View className="flex-row items-center gap-2 flex-1">
                    <Icon size={16} color="#5F5B50" />
                    <View className="flex-1">
                      <Text className="text-[13.5px] text-stone-800">{meta.label}</Text>
                      {!!sys.description && <Text className="text-[11.5px] text-stone-400">{sys.description}</Text>}
                    </View>
                  </View>
                  <View
                    className="items-center justify-center rounded"
                    style={{ width: 20, height: 20, backgroundColor: checked ? PRIMARY : "white", borderWidth: checked ? 0 : 1, borderColor: "#D8D5CB" }}
                  >
                    {checked && <Check size={14} color="white" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

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
