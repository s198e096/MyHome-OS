import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import KeyboardDoneBar, { KEYBOARD_ACCESSORY_ID } from "../components/KeyboardDoneBar.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

export default function EditProfileScreen({ profile, onBack, onSave }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [propertyName, setPropertyName] = useState(profile.propertyName || "");
  const [address, setAddress] = useState(profile.address);
  const [propertyValue, setPropertyValue] = useState(profile.propertyValue != null ? String(profile.propertyValue) : "");
  const [bedrooms, setBedrooms] = useState(profile.bedrooms != null ? String(profile.bedrooms) : "");
  const [yearBuilt, setYearBuilt] = useState(profile.yearBuilt != null ? String(profile.yearBuilt) : "");
  const [purchasePrice, setPurchasePrice] = useState(profile.purchasePrice != null ? String(profile.purchasePrice) : "");
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  function handleSubmit() {
    if (!name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    let value = null;
    if (propertyValue.trim()) {
      const num = parseFloat(propertyValue);
      if (isNaN(num) || num < 0) return setError("Enter a valid property value.");
      value = num;
    }
    // Flags it as a manual override only when the number actually changed,
    // so the monthly RentCast refresh knows to protect it going forward.
    const valueChanged = value !== (profile.propertyValue ?? null);
    onSave({
      name: name.trim(),
      email: email.trim(),
      propertyName: propertyName.trim(),
      address: address.trim(),
      propertyValue: value,
      ...(valueChanged ? { propertyValueSource: "Manual" } : {}),
      bedrooms: bedrooms.trim() ? parseInt(bedrooms, 10) : null,
      yearBuilt: yearBuilt.trim() ? parseInt(yearBuilt, 10) : null,
      purchasePrice: purchasePrice.trim() ? parseFloat(purchasePrice) : null,
    });
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
        <Text className="text-[13px] text-stone-500">Account</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-4">Edit profile</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Name"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <TextInput
        value={propertyName}
        onChangeText={setPropertyName}
        placeholder="Property name (e.g. Main House)"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Home address"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <TextInput
        value={propertyValue}
        onChangeText={setPropertyValue}
        placeholder="Estimated property value ($)"
        inputMode="decimal"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <TextInput
        value={purchasePrice}
        onChangeText={setPurchasePrice}
        placeholder="Purchase price ($)"
        inputMode="decimal"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
      />
      <View className="flex-row gap-2 mb-3">
        <TextInput
          value={bedrooms}
          onChangeText={setBedrooms}
          placeholder="Bedrooms"
          inputMode="numeric"
          className="flex-1 px-3 py-2 rounded-lg text-[13.5px]"
          style={fieldStyle}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />
        <TextInput
          value={yearBuilt}
          onChangeText={setYearBuilt}
          placeholder="Year built"
          inputMode="numeric"
          className="flex-1 px-3 py-2 rounded-lg text-[13.5px]"
          style={fieldStyle}
          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
        />
      </View>

      {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

      <Pressable onPress={handleSubmit} className="w-full py-2.5 rounded-lg items-center" style={{ backgroundColor: PRIMARY }}>
        <Text className="text-[13.5px] font-semibold text-white">Save changes</Text>
      </Pressable>
    </ScrollView>
    <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}
