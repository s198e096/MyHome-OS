import { useState } from "react";
import { ScrollView, Text, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

export default function EditProfileScreen({ profile, onBack, onSave }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [propertyValue, setPropertyValue] = useState(profile.propertyValue != null ? String(profile.propertyValue) : "");
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
    onSave({ name: name.trim(), email: email.trim(), address: address.trim(), propertyValue: value });
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
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
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
      />
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="Home address"
        className="w-full mb-2 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
      />
      <TextInput
        value={propertyValue}
        onChangeText={setPropertyValue}
        placeholder="Estimated property value ($)"
        inputMode="decimal"
        className="w-full mb-3 px-3 py-2 rounded-lg text-[13.5px]"
        style={fieldStyle}
      />

      {error && <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

      <Pressable onPress={handleSubmit} className="w-full py-2.5 rounded-lg items-center" style={{ backgroundColor: PRIMARY }}>
        <Text className="text-[13.5px] font-semibold text-white">Save changes</Text>
      </Pressable>
    </ScrollView>
  );
}
