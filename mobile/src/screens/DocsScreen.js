import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, FileText } from "lucide-react-native";
import { PRIMARY } from "../lib/constants.js";

export default function DocsScreen({ documents, systemById, onEdit, onAdd }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Documents</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {documents.map((d, i) => {
          const sys = systemById(d.systemId);
          return (
            <Pressable
              key={d.id}
              onPress={() => onEdit(d)}
              className="flex-row items-center gap-3 py-2.5"
              style={{ borderBottomWidth: i < documents.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              {d.photoUrl && !d.photoUrl.toLowerCase().endsWith(".pdf") ? (
                <Image source={{ uri: d.photoUrl }} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: "#E0E8D3" }} />
              ) : (
                <FileText size={17} color="#5F5B50" />
              )}
              <View>
                <Text className="text-[13.5px] text-stone-800">{d.label}</Text>
                <Text className="text-[11.5px] text-stone-400">{d.type}{sys ? " · " + sys.brand + " " + sys.model : ""}</Text>
              </View>
            </Pressable>
          );
        })}
        {documents.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No documents yet.</Text>}
      </View>
    </ScrollView>
  );
}
