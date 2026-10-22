import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, ChevronRight, FileText } from "lucide-react-native";
import { PRIMARY, systemShortName, systemIcon } from "../lib/constants.js";

// First page of Documents: a system per row (only systems that actually
// have documents), tap through to see that system's documents — rather
// than one flat list of every document across every system.
export default function DocsScreen({ documents, systems, onSelectSystem, onSelectGeneral, onAdd }) {
  const insets = useSafeAreaInsets();

  const groups = systems
    .map((sys) => ({ sys, count: documents.filter((d) => d.systemId === sys.id).length }))
    .filter((g) => g.count > 0);
  const generalCount = documents.filter((d) => !d.systemId).length;
  const isEmpty = groups.length === 0 && generalCount === 0;

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Documents</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {groups.map(({ sys, count }, i) => {
          const Icon = systemIcon(sys);
          return (
            <Pressable
              key={sys.id}
              onPress={() => onSelectSystem(sys)}
              className="flex-row items-center justify-between py-2.5"
              style={{ borderBottomWidth: i < groups.length - 1 || generalCount > 0 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <View className="rounded-lg p-2 bg-[#F5F8F0]">
                  <Icon size={17} color="#5F5B50" />
                </View>
                <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{systemShortName(sys)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[12px] text-stone-400">{count}</Text>
                <ChevronRight size={15} color="#B8B4A8" />
              </View>
            </Pressable>
          );
        })}
        {generalCount > 0 && (
          <Pressable onPress={onSelectGeneral} className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center gap-3 flex-1 min-w-0">
              <View className="rounded-lg p-2 bg-[#F5F8F0]">
                <FileText size={17} color="#5F5B50" />
              </View>
              <Text className="text-[13.5px] text-stone-800">General</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-[12px] text-stone-400">{generalCount}</Text>
              <ChevronRight size={15} color="#B8B4A8" />
            </View>
          </Pressable>
        )}
        {isEmpty && <Text className="py-3 text-[13px] text-stone-400">No documents yet.</Text>}
      </View>
    </ScrollView>
  );
}
