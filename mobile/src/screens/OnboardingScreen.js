import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Image, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, Sparkles, ChevronLeft, Check, Search } from "lucide-react-native";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META } from "../lib/constants.js";
import { autocompleteAddress } from "../lib/mapbox.js";
import { fetchPropertyDetails } from "../lib/db.js";
import { buildFeatureSummary } from "../lib/propertyFeatures.js";
import { useAppData } from "../lib/app-data-context.js";
import OnboardingTransition from "../components/OnboardingTransition.js";
import KeyboardDoneBar, { KEYBOARD_ACCESSORY_ID } from "../components/KeyboardDoneBar.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

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
  const { saveProfile, addSystem } = useAppData();
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (step !== "transition") return;
    const timer = setTimeout(() => setStep("property"), 1600);
    return () => clearTimeout(timer);
  }, [step]);

  function handleAddressChange(text) {
    setAddress(text);
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
        if (requestId === requestIdRef.current) setSuggestions([]);
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
        onboardingCompleted: true,
      });
      for (const sys of detectedSystems) {
        if (!confirmedSystems[sys.key]) continue;
        await addSystem({ category: sys.category, brand: null, model: null, location: "" });
      }
    } catch {
      setError("Couldn't save. Try again.");
      setSaving(false);
    }
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
        <Text className="text-[13.5px] font-semibold text-white">{saving ? "Saving..." : "Save property"}</Text>
      </Pressable>
    </ScrollView>
    <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}
