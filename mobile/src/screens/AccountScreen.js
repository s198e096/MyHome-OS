import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pencil, ChevronRight } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, PLANS } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

export default function AccountScreen({ profile, onEdit, onManagePlan, onSignOut }) {
  const planName = PLANS.find((p) => p.id === profile.plan)?.name || "Free";
  const insets = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[17px] font-semibold text-stone-900">Account</Text>
        <Pressable onPress={onEdit} className="flex-row items-center gap-1">
          <Pencil size={14} color={PRIMARY} />
          <Text className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Edit</Text>
        </Pressable>
      </View>

      <View className="items-center mb-5">
        <View className="rounded-full items-center justify-center mb-2" style={{ width: 64, height: 64, backgroundColor: PRIMARY }}>
          <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="text-[15px] font-semibold text-stone-900">{profile.name}</Text>
        <Text className="text-[12.5px] text-stone-400">{profile.email}</Text>
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Home</Text>
      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <View className="py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: "#E7EEDB" }}>
          <Text className="text-[13.5px] text-stone-800">Address</Text>
          <Text className="text-[12px] text-stone-500 mt-0.5">{profile.address}</Text>
        </View>
        {profile.propertyValue != null && (
          <LedgerRow
            label="Home value"
            sub={profile.propertyValueSource ? `Source: ${profile.propertyValueSource}` : undefined}
            value={money(profile.propertyValue)}
          />
        )}
        <Pressable onPress={onManagePlan} className="flex-row items-center justify-between py-2.5">
          <Text className="text-[13.5px] text-stone-800">Plan</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>{planName}</Text>
            <ChevronRight size={15} color="#B8B4A8" />
          </View>
        </Pressable>
      </View>

      <Pressable onPress={onSignOut} className="w-full py-2.5 rounded-lg items-center mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[13.5px] font-semibold" style={{ color: STATUS_COLOR.red }}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
