import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { PRIMARY, COMMON_SYSTEM_TASKS, recurrenceLabel, systemShortName, systemIcon } from "../lib/constants.js";
import { DateField } from "../components/ItemFields.js";

// Two steps: pick a system, then pick which of its common maintenance
// tasks to add (already-present ones are left out) and a start date —
// faster than typing each one in manually via "Add task manually".
export default function ImportTasksScreen({ systems, tasks, onBack, onImport }) {
  const insets = useSafeAreaInsets();
  const [sys, setSys] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [startDate, setStartDate] = useState("");
  const [importing, setImporting] = useState(false);

  function toggle(title) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  if (!sys) {
    return (
      <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Tasks</Text>
        </Pressable>
        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Import tasks</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">Pick a system to see its common maintenance tasks.</Text>
        <View className="rounded-xl bg-white px-3 mb-6" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          {systems.map((s, i) => {
            const Icon = systemIcon(s);
            return (
              <Pressable
                key={s.id}
                onPress={() => setSys(s)}
                className="flex-row items-center gap-3 py-2.5"
                style={{ borderBottomWidth: i < systems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="rounded-lg p-2 bg-[#F5F8F0]">
                  <Icon size={17} color="#5F5B50" />
                </View>
                <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{systemShortName(s)}</Text>
              </Pressable>
            );
          })}
          {systems.length === 0 && <Text className="py-3 text-[13px] text-stone-400">Add a system first.</Text>}
        </View>
      </ScrollView>
    );
  }

  const existingTitles = new Set(tasks.filter((t) => t.systemId === sys.id).map((t) => t.title.toLowerCase()));
  const suggestions = (COMMON_SYSTEM_TASKS[sys.category] || []).filter((d) => !existingTitles.has(d.title.toLowerCase()));

  async function handleImport() {
    const defs = suggestions.filter((s) => selected.has(s.title));
    if (defs.length === 0 || !startDate) return;
    setImporting(true);
    try {
      await onImport(sys.id, defs, startDate);
      onBack();
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => setSys(null)} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Choose a different system</Text>
      </Pressable>
      <Text className="text-[17px] font-semibold text-stone-900 mb-1">{systemShortName(sys)}</Text>
      <Text className="text-[12.5px] text-stone-500 mb-4">
        {suggestions.length > 0
          ? "Pick the ones you want tracked."
          : "Nothing new to suggest — you already have these, or we don't have suggestions for this type yet."}
      </Text>

      {suggestions.length > 0 && (
        <>
          <View className="rounded-xl bg-white px-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            {suggestions.map((def, i) => {
              const checked = selected.has(def.title);
              return (
                <Pressable
                  key={def.title}
                  onPress={() => toggle(def.title)}
                  className="flex-row items-center justify-between py-2.5"
                  style={{ borderBottomWidth: i < suggestions.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                    <View
                      className="items-center justify-center rounded"
                      style={{ width: 20, height: 20, backgroundColor: checked ? PRIMARY : "white", borderWidth: checked ? 0 : 1, borderColor: "#D8D5CB" }}
                    >
                      {checked && <Check size={14} color="white" />}
                    </View>
                    <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{def.title}</Text>
                  </View>
                  <Text className="text-[11.5px] text-stone-400 pl-2">{recurrenceLabel(def.recurrence)}</Text>
                </Pressable>
              );
            })}
          </View>

          <DateField label="Start date" value={startDate} onChange={setStartDate} optional />

          <Pressable
            onPress={handleImport}
            disabled={selected.size === 0 || !startDate || importing}
            className="w-full py-2.5 rounded-lg items-center mb-6"
            style={{ backgroundColor: PRIMARY, opacity: selected.size === 0 || !startDate || importing ? 0.5 : 1 }}
          >
            <Text className="text-[13.5px] font-semibold text-white">
              {importing ? "Importing..." : `Import ${selected.size} task${selected.size === 1 ? "" : "s"}`}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
