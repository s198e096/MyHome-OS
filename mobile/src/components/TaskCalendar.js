import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, systemShortName, recurrenceLabel } from "../lib/constants.js";
import { TODAY, daysUntil, futureOccurrences } from "../lib/forecast.js";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Month-grid calendar of open tasks by due date. A filled dot marks days with
// a task due (red if any of that day's tasks are overdue); tapping a day
// lists its tasks below the grid. A task that repeats also lands on every later
// date it repeats on (a hollow dot, "Monthly" etc. in the list), so paging
// ahead shows it as recurring; the repeats are worked out here, not stored.
export default function TaskCalendar({ tasks, systemById, onEditTask }) {
  const [viewDate, setViewDate] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => TODAY.toISOString().slice(0, 10));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayKey = TODAY.toISOString().slice(0, 10);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  // date -> [{ task, projected }]. A task sits on its own due date; a repeating
  // one also sits on each later repeat up to the end of the viewed month.
  const lastDayKey = toDateKey(year, month, daysInMonth);
  const tasksByDate = {};
  for (const t of tasks) {
    if (!t.dueDate) continue;
    (tasksByDate[t.dueDate] ||= []).push({ task: t, projected: false });
    if (t.recurrence) {
      for (const date of futureOccurrences(t.dueDate, t.recurrence, lastDayKey)) {
        (tasksByDate[date] ||= []).push({ task: t, projected: true });
      }
    }
  }
  const hasRecurring = tasks.some((t) => t.dueDate && t.recurrence);

  function changeMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
    setSelectedDate(null);
  }

  const selectedTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Pressable onPress={() => changeMonth(-1)} hitSlop={8} className="p-1">
          <ChevronLeft size={18} color="#78716c" />
        </Pressable>
        <Text className="text-[14.5px] font-semibold text-stone-900">
          {viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={8} className="p-1">
          <ChevronRight size={18} color="#78716c" />
        </Pressable>
      </View>

      <View className="flex-row mb-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <View key={i} style={{ width: `${100 / 7}%` }} className="items-center">
            <Text className="text-[10.5px] font-semibold text-stone-400">{w}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap mb-4">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstWeekday + 1;
          const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const dateKey = inMonth ? toDateKey(year, month, dayNum) : null;
          const dayTasks = dateKey ? tasksByDate[dateKey] || [] : [];
          const isToday = dateKey === todayKey;
          const isSelected = !!dateKey && dateKey === selectedDate;
          const hasOverdue = dayTasks.some((e) => !e.projected && daysUntil(e.task.dueDate) < 0);
          // Only repeats land on this day (nothing is actually due): hollow dot.
          const repeatsOnly = dayTasks.length > 0 && dayTasks.every((e) => e.projected);

          return (
            <Pressable
              key={i}
              disabled={!inMonth}
              onPress={() => setSelectedDate(dateKey)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
              className="items-center justify-center"
            >
              {inMonth && (
                <View
                  className="items-center justify-center rounded-full"
                  style={{ width: 30, height: 30, backgroundColor: isSelected ? PRIMARY : isToday ? "#EAF1E3" : "transparent" }}
                >
                  <Text
                    className="text-[13px]"
                    style={{
                      color: isSelected ? "white" : isToday ? PRIMARY : "#44403c",
                      fontWeight: isSelected || isToday ? "700" : "400",
                    }}
                  >
                    {dayNum}
                  </Text>
                  {dayTasks.length > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 1,
                        width: repeatsOnly ? 5 : 4,
                        height: repeatsOnly ? 5 : 4,
                        borderRadius: 3,
                        ...(repeatsOnly
                          ? { borderWidth: 1, borderColor: isSelected ? "white" : PRIMARY, backgroundColor: "transparent" }
                          : { backgroundColor: isSelected ? "white" : hasOverdue ? STATUS_COLOR.red : PRIMARY }),
                      }}
                    />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {hasRecurring && (
        <View className="flex-row items-center gap-4 mb-2 px-1">
          <View className="flex-row items-center gap-1.5">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY }} />
            <Text className="text-[11px] text-stone-500">Due</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: PRIMARY }} />
            <Text className="text-[11px] text-stone-500">Repeats</Text>
          </View>
        </View>
      )}

      <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {!selectedDate && <Text className="py-3 text-[13px] text-stone-400">Tap a day to see its tasks.</Text>}
        {!!selectedDate && selectedTasks.length === 0 && (
          <Text className="py-3 text-[13px] text-stone-400">
            No tasks due {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
          </Text>
        )}
        {selectedTasks.map(({ task: t }) => {
          const sys = t.systemId ? systemById(t.systemId) : null;
          return (
            <Pressable
              key={`${t.id}-${selectedDate}`}
              onPress={() => onEditTask(t)}
              className="flex-row items-center justify-between py-2.5"
              style={{ borderBottomWidth: 1, borderBottomColor: "#E7EEDB" }}
            >
              <View className="flex-1 min-w-0">
                <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{t.title}</Text>
                <Text className="text-[11.5px] text-stone-400">{sys ? systemShortName(sys) : "General"}</Text>
              </View>
              {!!t.recurrence && (
                <View className="flex-row items-center gap-1 pl-2">
                  <Repeat size={12} color={PRIMARY} />
                  <Text className="text-[11.5px] font-semibold" style={{ color: PRIMARY }}>{recurrenceLabel(t.recurrence)}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
