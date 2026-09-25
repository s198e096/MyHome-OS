import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { Plus, Sofa } from "lucide-react-native";
import { PRIMARY, ROOMS } from "../lib/constants.js";
import { money } from "../lib/forecast.js";

export default function FurnitureScreen({ furniture, onEdit, onAdd }) {
  const totalValue = furniture.reduce((s, f) => s + f.value, 0);
  const roomsInUse = ROOMS.filter((r) => furniture.some((f) => f.room === r));

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4 pt-5" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Furniture</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[11px] text-stone-400">Total insured value</Text>
        <Text className="text-[18px] font-semibold text-stone-900">{money(totalValue)}</Text>
      </View>

      {furniture.length === 0 && (
        <View className="rounded-xl bg-white px-3 py-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[13px] text-stone-400">No furniture logged yet. Snap a photo of each room to get started.</Text>
        </View>
      )}

      {roomsInUse.map((room) => {
        const items = furniture.filter((f) => f.room === room);
        return (
          <View key={room} className="mb-4">
            <Text className="text-[12px] font-semibold text-stone-500 mb-1">{room}</Text>
            <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              {items.map((f, i) => (
                <Pressable
                  key={f.id}
                  onPress={() => onEdit(f)}
                  className="flex-row items-center gap-3 py-2.5"
                  style={{ borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  {f.photoUrl ? (
                    <Image source={{ uri: f.photoUrl }} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: "#E0E8D3" }} />
                  ) : (
                    <Sofa size={17} color="#5F5B50" />
                  )}
                  <View className="flex-1 min-w-0">
                    <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{f.name}</Text>
                    {f.note && <Text className="text-[11.5px] text-stone-400" numberOfLines={1}>{f.note}</Text>}
                  </View>
                  <Text className="text-[13px] text-stone-800">{money(f.value)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
