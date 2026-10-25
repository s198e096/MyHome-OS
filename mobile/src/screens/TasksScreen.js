import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Check, Repeat, Pencil, CheckCircle2, Trash2 } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, systemShortName } from "../lib/constants.js";
import { daysUntil } from "../lib/forecast.js";
import SelectModal from "../components/SelectModal.js";

const ADD_OPTIONS = [
  { value: "manual", label: "Add task manually" },
  { value: "import", label: "Import common tasks for a system" },
];

const TABS = [
  { key: "open", label: "Tasks" },
  { key: "completed", label: "Completed" },
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

function RowButton({ icon: Icon, label, color, onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "#F5F8F0" }}>
      <Icon size={12} color={color || "#5F5B50"} />
      <Text className="text-[11.5px] font-semibold" style={{ color: color || "#5F5B50" }}>{label}</Text>
    </Pressable>
  );
}

export default function TasksScreen({ tasks, completed, systemById, onRemoveCompleted, onComplete, onEdit, onAddManual, onImportTasks }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState("open");
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const openGroups = groupBySystem(tasks, systemById);
  const completedGroups = groupBySystem(completed, systemById);

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

      <View className="flex-row bg-white rounded-xl p-1 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            className="flex-1 items-center py-2 rounded-lg"
            style={{ backgroundColor: tab === t.key ? PRIMARY : "transparent" }}
          >
            <Text className="text-[13px] font-semibold" style={{ color: tab === t.key ? "white" : "#78716c" }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "open" && (
        <>
          {tasks.length === 0 && (
            <View className="rounded-xl bg-white px-3 py-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              <Text className="text-[13px] text-stone-400">No open tasks.</Text>
            </View>
          )}

          {openGroups.map(({ label, tasks: groupTasks }, g) => (
            <View key={label + g} className="mb-4">
              <Text className="text-[12px] font-semibold text-stone-500 mb-1">{label}</Text>
              <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
                {groupTasks.map((t, i) => {
                  const days = daysUntil(t.dueDate);
                  return (
                    <View
                      key={t.id}
                      className="py-2.5"
                      style={{ borderBottomWidth: i < groupTasks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                    >
                      <View className="flex-row items-center justify-between mb-1.5 gap-2">
                        <View className="flex-row items-center gap-1 flex-1 min-w-0">
                          <Text className="text-[13.5px] text-stone-800 flex-1 min-w-0" numberOfLines={1}>{t.title}</Text>
                          {!!t.recurrence && <Repeat size={11} color="#9C978C" />}
                        </View>
                        <Text style={{ color: days < 0 ? STATUS_COLOR.red : days <= 14 ? STATUS_COLOR.yellow : "#9C978C" }} className="text-[12px]">
                          {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                        </Text>
                      </View>
                      <View className="flex-row gap-2">
                        <RowButton icon={Pencil} label="Edit" onPress={() => onEdit(t)} />
                        <RowButton icon={CheckCircle2} label="Complete" color={STATUS_COLOR.green} onPress={() => onComplete(t)} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}

      {tab === "completed" && (
        <>
          {completed.length === 0 && (
            <View className="rounded-xl bg-white px-3 py-3 mb-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              <Text className="text-[13px] text-stone-400">No completed tasks yet.</Text>
            </View>
          )}

          {completedGroups.map(({ label, tasks: groupTasks }, g) => (
            <View key={label + g} className="mb-4">
              <Text className="text-[12px] font-semibold text-stone-500 mb-1">{label}</Text>
              <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
                {groupTasks.map((t, i) => (
                  <View
                    key={t.id}
                    className="flex-row items-center gap-2.5 py-2.5"
                    style={{ borderBottomWidth: i < groupTasks.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                  >
                    <Check size={15} color={STATUS_COLOR.green} />
                    <Text className="text-[13px] text-stone-400 flex-1 min-w-0" numberOfLines={1} style={{ textDecorationLine: "line-through" }}>
                      {t.title}
                    </Text>
                    {!!t.completedDate && (
                      <Text className="text-[11px] text-stone-400">
                        {new Date(`${t.completedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    )}
                    <Pressable onPress={() => onRemoveCompleted(t)} hitSlop={8} className="p-1">
                      <Trash2 size={14} color="#B8B4A8" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
