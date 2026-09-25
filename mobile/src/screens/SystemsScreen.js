import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { Plus, ChevronRight } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, FREE_SYSTEM_LIMIT } from "../lib/constants.js";
import { systemStatus } from "../lib/forecast.js";
import StatusDot from "../components/StatusDot.js";

export default function SystemsScreen({ systems, tasks, onSelect, onAdd, atLimit }) {
  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4 pt-5" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Systems</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      {atLimit && (
        <View className="rounded-xl px-3 py-2 mb-3" style={{ backgroundColor: "#FAEEDA" }}>
          <Text className="text-[12px]" style={{ color: "#8A5A0F" }}>
            Free plan limit reached ({FREE_SYSTEM_LIMIT} systems). Tap + to upgrade for unlimited systems.
          </Text>
        </View>
      )}

      <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {systems.map((s, i) => {
          const meta = CATEGORY_META[s.category];
          const Icon = meta.icon;
          const status = systemStatus(s, tasks);
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelect(s)}
              className="flex-row items-center justify-between py-3"
              style={{ borderBottomWidth: i < systems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              <View className="flex-row items-center gap-3">
                {s.photoUrl ? (
                  <Image source={{ uri: s.photoUrl }} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: "#E0E8D3" }} />
                ) : (
                  <View className="rounded-lg p-2 bg-[#F5F8F0]">
                    <Icon size={17} color="#5F5B50" />
                  </View>
                )}
                <View>
                  <Text className="text-[13.5px] text-stone-800">{s.brand} {s.model}</Text>
                  <Text className="text-[11.5px] text-stone-400">{meta.label} · {s.location}</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <StatusDot status={status} />
                <ChevronRight size={15} color="#B8B4A8" />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-xl bg-white p-3 mt-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[11px] text-stone-500 leading-relaxed">
          <Text className="font-semibold text-stone-600">Tip: </Text>
          Many home systems are actually made of multiple separate parts, each with its own age, price, and warranty. Log each part as its own system rather than combining them into one entry.
        </Text>
        <View className="mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: "#E7EEDB", borderStyle: "dashed" }}>
          <Text className="text-[11px] text-stone-500 leading-relaxed">
            <Text className="font-semibold text-stone-600">Example: </Text>
            Your HVAC isn't one system — the outdoor unit (the fan on your patio) and the indoor unit (coil and air handler, usually in a closet or attic) are two separate pieces, often installed at different times, with different warranties, and replaced independently.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
