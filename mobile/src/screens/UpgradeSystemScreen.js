import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { CATEGORY_META, systemShortName, systemIcon } from "../lib/constants.js";

// Reached from Home's "Upgrade a system" action. First asks whether this
// upgrade replaces a system already tracked here — if so, which one, so it
// can be archived once the new one is saved — or is a system that was
// never tracked before, which is just a regular add with nothing to retire.
export default function UpgradeSystemScreen({ systems, onBack, onPickNew, onPickReplacement }) {
  const insets = useSafeAreaInsets();
  const [choosingReplacement, setChoosingReplacement] = useState(false);
  const activeSystems = systems.filter((s) => !s.archived);

  if (choosingReplacement) {
    return (
      <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setChoosingReplacement(false)} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Back</Text>
        </Pressable>
        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Which system is this replacing?</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">It&apos;ll be archived once you save the new one.</Text>
        <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          {activeSystems.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No systems to replace yet.</Text>}
          {activeSystems.map((s, i) => {
            const Icon = systemIcon(s);
            const meta = CATEGORY_META[s.category];
            return (
              <Pressable
                key={s.id}
                onPress={() => onPickReplacement(s)}
                className="flex-row items-center justify-between py-2.5"
                style={{ borderBottomWidth: i < activeSystems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="flex-row items-center gap-3 flex-1 min-w-0">
                  <View className="rounded-lg p-2 bg-[#F5F8F0]">
                    <Icon size={17} color="#5F5B50" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{systemShortName(s)}</Text>
                    <Text className="text-[11.5px] text-stone-400" numberOfLines={1}>
                      {meta.label}{s.location ? ` · ${s.location}` : ""}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={15} color="#B8B4A8" />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Home</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Upgrade a system</Text>
      <Text className="text-[12.5px] text-stone-500 mb-4">Is this replacing a system you already track here?</Text>

      <Pressable onPress={() => setChoosingReplacement(true)} className="rounded-xl bg-white p-4 mb-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[14px] font-semibold text-stone-900 mb-1">Yes, replacing one I track</Text>
        <Text className="text-[12px] text-stone-500">Pick which one — it&apos;ll be archived once the new one is saved.</Text>
      </Pressable>

      <Pressable onPress={onPickNew} className="rounded-xl bg-white p-4 mb-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[14px] font-semibold text-stone-900 mb-1">No, it&apos;s a new system</Text>
        <Text className="text-[12px] text-stone-500">Nothing to retire — adds it like any other system.</Text>
      </Pressable>
    </ScrollView>
  );
}
