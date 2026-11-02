import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, X } from "lucide-react-native";
import { systemName, systemShortName } from "../lib/constants.js";
import { CURRENT_YEAR, money, yearOf } from "../lib/forecast.js";
import { fmtDate, fmtMonthDay } from "../lib/reports/format.js";
import LedgerRow from "../components/LedgerRow.js";

// "Oct 5" for this year's expenses, "Oct 5, 2025" for older ones (dates can be
// backdated, so the year matters once an entry isn't from this year).
const dateLabel = (date) => (yearOf(date) === CURRENT_YEAR ? fmtMonthDay(date) : fmtDate(date));

// Reached by tapping the "Expense log" row on the Costs tab, or a slice of
// one of its pie charts — the full flat list lives on its own page so the
// Costs tab itself stays focused on the outlook and charts rather than a
// long scroll of every expense. A chart slice narrows it to that system
// (and year); the filter shows as a clearable chip up top.
export default function ExpenseLogScreen({ expenses, systemById, filterSystemId, filterYear, onBack, onEdit, onClearFilter }) {
  const insets = useSafeAreaInsets();
  const hasFilter = !!filterSystemId || filterYear != null;
  const filtered = expenses.filter((e) => {
    if (filterSystemId) {
      const key = e.systemId || "general";
      if (key !== filterSystemId) return false;
    }
    if (filterYear != null && yearOf(e.date) !== filterYear) return false;
    return true;
  });
  const filterLabel = [
    filterSystemId === "general" ? "General" : filterSystemId ? systemShortName(systemById(filterSystemId)) : null,
    filterYear != null ? String(filterYear) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Costs</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">Expense log</Text>

      {hasFilter && (
        <Pressable
          onPress={onClearFilter}
          className="flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5 mb-3"
          style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#E0E8D3" }}
        >
          <Text className="text-[12.5px] font-semibold text-stone-700">{filterLabel}</Text>
          <X size={13} color="#78716c" />
        </Pressable>
      )}

      <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {filtered.length === 0 && (
          <Text className="py-3 text-[13px] text-stone-400">
            {expenses.length === 0 ? "No expenses logged yet." : "No expenses match this filter."}
          </Text>
        )}
        {filtered
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((e) => {
            const sys = systemById(e.systemId);
            return (
              <LedgerRow
                key={e.id}
                label={e.note}
                sub={`${e.category}${sys ? " · " + systemName(sys) : ""} · ${dateLabel(e.date)}${e.vendor ? " · " + e.vendor : ""}`}
                value={money(e.amount)}
                onPress={() => onEdit(e)}
              />
            );
          })}
      </View>
    </ScrollView>
  );
}
