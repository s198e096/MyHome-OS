import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, systemShortName } from "../lib/constants.js";
import { TODAY, daysUntil } from "../lib/forecast.js";
import LedgerRow from "./LedgerRow.js";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Month-grid calendar of open tasks by due date. A dot marks days with a
// task due (red if any of that day's tasks are overdue); tapping a day
// lists its tasks below the grid.
export default function TaskCalendar({ tasks, systemById, onEditTask }) {
  const [viewDate, setViewDate] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => TODAY.toISOString().slice(0, 10));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayKey = TODAY.toISOString().slice(0, 10);

  const tasksByDate = {};
  for (const t of tasks) {
    if (!t.dueDate) continue;
    (tasksByDate[t.dueDate] ||= []).push(t);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

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
          const hasOverdue = dayTasks.some((t) => daysUntil(t.dueDate) < 0);

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
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isSelected ? "white" : hasOverdue ? STATUS_COLOR.red : PRIMARY,
                      }}
                    />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {!selectedDate && <Text className="py-3 text-[13px] text-stone-400">Tap a day to see its tasks.</Text>}
        {!!selectedDate && selectedTasks.length === 0 && (
          <Text className="py-3 text-[13px] text-stone-400">
            No tasks due {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
          </Text>
        )}
        {selectedTasks.map((t) => {
          const sys = t.systemId ? systemById(t.systemId) : null;
          return <LedgerRow key={t.id} label={t.title} sub={sys ? systemShortName(sys) : "General"} value="" onPress={() => onEditTask(t)} />;
        })}
      </View>
    </View>
  );
}
