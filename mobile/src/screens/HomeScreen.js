import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Home } from "lucide-react-native";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM, STATUS_COLOR, systemName } from "../lib/constants.js";
import { TODAY, daysUntil, money } from "../lib/forecast.js";
import SelectModal from "../components/SelectModal.js";

const HOME_ACTIONS = [
  { value: "chat", label: "Chat with an AI agent about your home" },
  { value: "problem", label: "Report a problem" },
  { value: "expense", label: "Report an expense" },
];

function HomeHero({ todoCount, overdueCount, systemsCount, profile, estimatedValue, onOpenAccount, onOpenAssistant, onNavigate }) {
  const greeting = overdueCount > 0 ? "Your home needs\nsome attention" : "Your home is in\ngreat shape";
  const insets = useSafeAreaInsets();
  const [actionsOpen, setActionsOpen] = useState(false);

  function handleAction(value) {
    setActionsOpen(false);
    if (value === "problem") onOpenAssistant("I'd like to report a problem: ");
    else if (value === "expense") onNavigate("/costs/new");
    else onOpenAssistant();
  }

  return (
    <LinearGradient
      colors={[HERO_BG_TOP, HERO_BG_BOTTOM]}
      className="px-5 pb-4 mb-5"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: insets.top + 20 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }} numberOfLines={1}>
          {profile.propertyName || "Home"}
        </Text>
        <Pressable
          onPress={onOpenAccount}
          className="rounded-full items-center justify-center"
          style={{ width: 32, height: 32, backgroundColor: PRIMARY }}
        >
          <Text style={{ color: "white", fontSize: 13, fontWeight: "700" }}>{profile.name.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      <View className="items-center mb-4">
        {greeting.split("\n").map((line) => (
          <Text key={line} className="text-[22px] font-bold text-center" style={{ color: PRIMARY, lineHeight: 28 }}>
            {line}
          </Text>
        ))}
      </View>

      {estimatedValue != null && (
        <View className="items-center mb-4">
          <Text className="text-[11px]" style={{ color: "#3B5169" }}>Estimated home value</Text>
          <Text className="text-[26px] font-bold" style={{ color: PRIMARY }}>{money(estimatedValue)}</Text>
        </View>
      )}

      <View className="mb-4">
        <Pressable onPress={() => setActionsOpen(true)} className="w-full flex-row items-center justify-center gap-2 bg-white rounded-2xl px-5 py-4">
          <Text className="text-[15.5px] font-semibold" style={{ color: PRIMARY }}>What would you like to do?</Text>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#F472B6" }} />
        </Pressable>
        <SelectModal
          visible={actionsOpen}
          title="Actions"
          options={HOME_ACTIONS}
          selectedValue={null}
          onSelect={handleAction}
          onClose={() => setActionsOpen(false)}
        />
      </View>

      <View className="rounded-2xl bg-white flex-row overflow-hidden">
        {[
          { label: "To-do", value: todoCount, tab: "/tasks" },
          { label: "Overdue", value: overdueCount, tab: "/tasks" },
          { label: "Systems", value: systemsCount, tab: "/systems" },
        ].map((s, i) => (
          <Pressable
            key={s.label}
            onPress={() => onNavigate(s.tab)}
            className="flex-1 items-center py-3"
            style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "#F0F0EA" }}
          >
            <Text className="text-[18px] font-bold" style={{ color: PRIMARY }}>{s.value}</Text>
            <Text className="text-[11px] text-stone-500">{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

function UpcomingTasksList({ tasks, systemById, onComplete }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[15px] font-bold text-stone-900">Upcoming tasks</Text>
        <Text className="text-[13px] text-stone-400">{tasks.length}</Text>
      </View>
      {tasks.length === 0 && (
        <View className="rounded-xl bg-white px-3 py-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[13px] text-stone-400">No tasks require your attention this month.</Text>
        </View>
      )}
      <View className="gap-2">
        {tasks.map((t, i) => {
          const sys = systemById(t.systemId);
          const days = daysUntil(t.dueDate);
          const barColor = days < 0 ? STATUS_COLOR.red : i === 1 ? "#7FB7B0" : "#D8D5CB";
          return (
            <View key={t.id} className="rounded-xl bg-white flex-row overflow-hidden" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              <View style={{ width: 4, backgroundColor: barColor }} />
              <View className="flex-1 px-3 py-2.5">
                <View className="flex-row items-center gap-2.5">
                  <Pressable onPress={() => onComplete(t)} hitSlop={8}>
                    <View className="rounded-full" style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: "#C9C5B8" }} />
                  </Pressable>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[14px] font-semibold text-stone-900" numberOfLines={1}>{t.title}</Text>
                    {sys && <Text className="text-[12px] text-stone-400">{systemName(sys)}</Text>}
                  </View>
                </View>
                {(t.duration || t.difficulty) && (
                  <View className="flex-row items-center gap-2 mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: "#E7EEDB", borderStyle: "dashed" }}>
                    {t.duration && (
                      <View className="flex-row items-center gap-1">
                        <Clock size={12} color="#78716c" />
                        <Text className="text-[12px] text-stone-500">{t.duration}</Text>
                      </View>
                    )}
                    {t.duration && t.difficulty && <Text className="text-stone-300">|</Text>}
                    {t.difficulty && <Text className="text-[12px] text-stone-500">{t.difficulty}</Text>}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen({ upcomingTasks, systemById, systems, tasks, profile, onOpenAccount, onOpenAssistant, onNavigate, onCompleteTask }) {
  const overdueCount = tasks.filter((t) => !t.completed && daysUntil(t.dueDate) < 0).length;
  const thisMonthTasks = upcomingTasks.filter((t) => {
    const d = new Date(`${t.dueDate}T00:00:00`);
    return d.getFullYear() === TODAY.getFullYear() && d.getMonth() === TODAY.getMonth();
  });

  const systemsValue = systems.reduce((s, sys) => s + (sys.replacementCost || 0), 0);
  const estimatedValue = profile.propertyValue != null ? profile.propertyValue + systemsValue : null;

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0]" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <HomeHero
        todoCount={upcomingTasks.length}
        overdueCount={overdueCount}
        systemsCount={systems.length}
        profile={profile}
        estimatedValue={estimatedValue}
        onOpenAccount={onOpenAccount}
        onOpenAssistant={onOpenAssistant}
        onNavigate={onNavigate}
      />

      <View className="px-4">
        {profile.propertyValue != null && (
          <View className="rounded-xl bg-white p-3 mb-5" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-[11px] text-stone-400">Estimated property value</Text>
                <Text className="text-[20px] font-bold" style={{ color: PRIMARY }}>{money(profile.propertyValue)}</Text>
                <Text className="text-[11px] text-stone-400" numberOfLines={1}>{profile.address}</Text>
              </View>
              <View className="rounded-lg p-2 bg-[#F5F8F0]">
                <Home size={20} color={PRIMARY} />
              </View>
            </View>
            {profile.propertyValueSource && (
              <View className="mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: "#E7EEDB", borderStyle: "dashed" }}>
                <Text className="text-[10px] text-stone-400">Source: {profile.propertyValueSource}</Text>
              </View>
            )}
          </View>
        )}

        <UpcomingTasksList tasks={thisMonthTasks} systemById={systemById} onComplete={onCompleteTask} />
      </View>
    </ScrollView>
  );
}
