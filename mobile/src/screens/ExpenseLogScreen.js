import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { systemName } from "../lib/constants.js";
import { money } from "../lib/forecast.js";
import LedgerRow from "../components/LedgerRow.js";

// Reached by tapping the "Expense log" row on the Costs tab — the full
// flat list lives on its own page so the Costs tab itself stays focused
// on the outlook and charts rather than a long scroll of every expense.
export default function ExpenseLogScreen({ expenses, systemById, onBack, onEdit }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Costs</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">Expense log</Text>
      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {expenses.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No expenses logged yet.</Text>}
        {expenses
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((e) => {
            const sys = systemById(e.systemId);
            return (
              <LedgerRow
                key={e.id}
                label={e.note}
                sub={`${e.category}${sys ? " · " + systemName(sys) : ""} · ${new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${e.vendor ? " · " + e.vendor : ""}`}
                value={money(e.amount)}
                onPress={() => onEdit(e)}
              />
            );
          })}
      </View>
    </ScrollView>
  );
}
