import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { PRIMARY } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

export default function CostsScreen({ expenses, forecast, systemById, onEdit, onAdd }) {
  const maxAmt = Math.max(...forecast.map((f) => f.amount), 1);
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Costs</Text>
        <Pressable onPress={onAdd} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">5-year forecast</Text>
      <View className="rounded-xl bg-white p-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {forecast.map((f) => (
          <View key={f.year} className="flex-row items-center gap-2 mb-2">
            <Text className="text-[12px] text-stone-500" style={{ width: 36 }}>{f.year}</Text>
            <View className="flex-1 rounded" style={{ backgroundColor: "#EFEDE6", height: 16 }}>
              <View className="h-full rounded" style={{ width: `${Math.max(6, (f.amount / maxAmt) * 100)}%`, backgroundColor: PRIMARY }} />
            </View>
            <Text className="text-[12px] text-stone-800 text-right" style={{ width: 64 }}>{money(f.amount)}</Text>
          </View>
        ))}
      </View>

      <Text className="text-[12px] font-semibold text-stone-500 mb-1">Expense log</Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {expenses
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((e) => {
            const sys = systemById(e.systemId);
            return (
              <LedgerRow
                key={e.id}
                label={e.note}
                sub={`${e.category}${sys ? " · " + sys.brand + " " + sys.model : ""} · ${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                value={money(e.amount)}
                onPress={() => onEdit(e)}
              />
            );
          })}
      </View>
    </ScrollView>
  );
}
