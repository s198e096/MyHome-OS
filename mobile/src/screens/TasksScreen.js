import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Check } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { daysUntil } from "../lib/forecast.js";

export default function TasksScreen({ tasks, completed, systemById, onToggle, onEdit, onAdd }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Tasks</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {tasks.map((t, i) => {
          const sys = systemById(t.systemId);
          const days = daysUntil(t.dueDate);
          return (
            <View
              key={t.id}
              className="flex-row items-center justify-between py-2.5"
              style={{ borderBottomWidth: i < tasks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
            >
              <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                <Pressable onPress={() => onToggle(t.id)}>
                  <View className="rounded-full" style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: "#C9C5B8" }} />
                </Pressable>
                <Pressable onPress={() => onEdit(t)} className="flex-1 min-w-0">
                  <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{t.title}</Text>
                  <Text className="text-[11.5px] text-stone-400">{sys ? `${sys.brand} ${sys.model}` : "General"}</Text>
                </Pressable>
              </View>
              <Text
                className="text-[12px] pl-2"
                style={{ color: days < 0 ? STATUS_COLOR.red : days <= 14 ? STATUS_COLOR.yellow : "#9C978C" }}
              >
                {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
              </Text>
            </View>
          );
        })}
        {tasks.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No open tasks.</Text>}
      </View>

      {completed.length > 0 && (
        <>
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Completed</Text>
          <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            {completed.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => onToggle(t.id)}
                className="flex-row items-center gap-2.5 py-2.5"
                style={{ borderBottomWidth: i < completed.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <Check size={15} color={STATUS_COLOR.green} />
                <Text className="text-[13px] text-stone-400" style={{ textDecorationLine: "line-through" }}>{t.title}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
