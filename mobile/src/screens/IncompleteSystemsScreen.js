import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { CATEGORY_META, systemName } from "../lib/constants.js";
import { missingSystemInfo } from "../lib/system-info.js";

export default function IncompleteSystemsScreen({ systems, onSelect, onBack }) {
  const insets = useSafeAreaInsets();
  const incomplete = systems
    .map((sys) => ({ sys, missing: missingSystemInfo(sys) }))
    .filter((x) => x.missing.length > 0);

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Home</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Complete your systems</Text>
      <Text className="text-[12.5px] text-stone-500 mb-3">
        {incomplete.length} system{incomplete.length === 1 ? "" : "s"} missing details. Tap one to fill it in — you can come back to this list anytime without saving.
      </Text>

      {incomplete.length === 0 ? (
        <View className="rounded-xl bg-white p-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[13px] text-stone-500">All your systems are complete.</Text>
        </View>
      ) : (
        <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          {incomplete.map(({ sys, missing }, i) => {
            const meta = CATEGORY_META[sys.category];
            const Icon = meta.icon;
            const shown = missing.slice(0, 3).join(", ");
            const more = missing.length > 3 ? ` +${missing.length - 3} more` : "";
            return (
              <Pressable
                key={sys.id}
                onPress={() => onSelect(sys)}
                className="flex-row items-center justify-between py-3"
                style={{ borderBottomWidth: i < incomplete.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="rounded-lg p-2 bg-[#F5F8F0]">
                    <Icon size={17} color="#5F5B50" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[13.5px] text-stone-800">{systemName(sys)}</Text>
                    <Text className="text-[11.5px] text-stone-400" numberOfLines={1}>Missing: {shown}{more}</Text>
                  </View>
                </View>
                <ChevronRight size={15} color="#B8B4A8" />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
