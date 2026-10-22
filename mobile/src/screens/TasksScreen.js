import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Check, Repeat } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, systemShortName } from "../lib/constants.js";
import { daysUntil } from "../lib/forecast.js";
import SelectModal from "../components/SelectModal.js";

const ADD_OPTIONS = [
  { value: "manual", label: "Add task manually" },
  { value: "import", label: "Import common tasks for a system" },
];

// Groups by system (in whatever order each system's first task appears in
// the already due-date-sorted `tasks` list, so the most urgent system's
// group leads) rather than one flat chronological feed — otherwise
// completing a recurring task immediately surfaces its freshly-scheduled
// next occurrence in the same spot, which reads as if nothing happened.
function groupBySystem(tasks, systemById) {
  const groups = new Map();
  for (const t of tasks) {
    const key = t.systemId || "general";
    if (!groups.has(key)) {
      const sys = t.systemId ? systemById(t.systemId) : null;
      groups.set(key, { label: sys ? systemShortName(sys) : "General", tasks: [] });
    }
    groups.get(key).tasks.push(t);
  }
  return [...groups.values()];
}

export default function TasksScreen({ tasks, completed, systemById, onToggle, onEdit, onAddManual, onImportTasks }) {
  const insets = useSafeAreaInsets();
  const groups = groupBySystem(tasks, systemById);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  function handleAddOption(value) {
    setAddMenuOpen(false);
    if (value === "import") onImportTasks();
    else onAddManual();
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[17px] font-semibold text-stone-900">Tasks</Text>
        <Pressable onPress={() => setAddMenuOpen(true)} className="rounded-full p-1.5" style={{ backgroundColor: PRIMARY }}>
          <Plus size={16} color="white" />
        </Pressable>
      </View>

      <SelectModal
        visible={addMenuOpen}
        title="Add task"
        options={ADD_OPTIONS}
        selectedValue={null}
        onSelect={handleAddOption}
        onClose={() => setAddMenuOpen(false)}
      />

      {tasks.length === 0 && (
        <View className="rounded-xl bg-white px-3 py-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[13px] text-stone-400">No open tasks.</Text>
        </View>
      )}

      {groups.map(({ label, tasks: groupTasks }, g) => (
        <View key={label + g} className="mb-4">
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">{label}</Text>
          <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            {groupTasks.map((t, i) => {
              const days = daysUntil(t.dueDate);
              return (
                <View
                  key={t.id}
                  className="flex-row items-center justify-between py-2.5"
                  style={{ borderBottomWidth: i < groupTasks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  <View className="flex-row items-center gap-2.5 flex-1 min-w-0">
                    <Pressable onPress={() => onToggle(t.id)} hitSlop={8}>
                      <View className="rounded-full" style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: "#C9C5B8" }} />
                    </Pressable>
                    <Pressable onPress={() => onEdit(t)} className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{t.title}</Text>
                        {!!t.recurrence && <Repeat size={11} color="#9C978C" />}
                      </View>
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
          </View>
        </View>
      ))}

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
