import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Clock, Home, Zap } from "lucide-react-native";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM, ACCENT_YELLOW, STATUS_COLOR, CATEGORY_META } from "../lib/constants.js";
import { daysUntil, money, systemStatus } from "../lib/forecast.js";
import { computeAutoChecks, computeEnergyScore } from "../lib/energyAudit.js";
import StatusDot from "../components/StatusDot.js";

const seedRecommendations = [
  { id: "r2", title: "Water Bill", subtitle: "Save $100 every month with a simple fix", cta: null, highlight: false },
  { id: "r3", title: "Filter Reminder", subtitle: "Set auto-reminders for HVAC filters", cta: null, highlight: false },
];

function HomeHero({ todoCount, overdueCount, systemsCount, profile, onOpenAccount, onNavigate }) {
  const greeting = overdueCount > 0 ? "Your home needs\nsome attention" : "Your home is in\ngreat shape";
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[HERO_BG_TOP, HERO_BG_BOTTOM]}
      className="px-5 pb-4 mb-5"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingTop: insets.top + 20 }}
    >
      <View className="flex-row items-center justify-end mb-3">
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

      <View className="items-center mb-4">
        <View className="flex-row items-center gap-2 bg-white rounded-full px-4 py-2">
          <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>Ask Anything</Text>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#F472B6" }} />
        </View>
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

function TodayList({ tasks, systemById }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[15px] font-bold text-stone-900">Today</Text>
        <Text className="text-[13px] text-stone-400">{tasks.length}</Text>
      </View>
      {tasks.length === 0 && (
        <View className="rounded-xl bg-white px-3 py-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[13px] text-stone-400">Nothing needs attention right now.</Text>
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
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 min-w-0">
                    <Text className="text-[14px] font-semibold text-stone-900" numberOfLines={1}>{t.title}</Text>
                    {sys && <Text className="text-[12px] text-stone-400">{sys.brand} {sys.model}</Text>}
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

function RecommendedList({ items }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[15px] font-bold text-stone-900">Recommended for you</Text>
        <Text className="text-[13px] text-stone-400">{items.length}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {items.map((r) => {
          const Icon = r.icon;
          const Wrapper = r.onClick ? Pressable : View;
          return (
            <Wrapper
              key={r.id}
              onPress={r.onClick}
              className="rounded-xl p-3"
              style={{
                width: 190,
                backgroundColor: r.highlight ? ACCENT_YELLOW : "white",
                borderWidth: r.highlight ? 0 : 1,
                borderColor: "#E0E8D3",
              }}
            >
              <View className="flex-row items-center justify-between gap-2 mb-1">
                <Text className="text-[13.5px] font-bold text-stone-900">{r.title}</Text>
                {Icon && <Icon size={15} color={PRIMARY} />}
              </View>
              <Text className="text-[12px] text-stone-600 mb-2">{r.subtitle}</Text>
              {r.cta && (
                <View className="rounded-full px-3 py-1 self-start bg-white">
                  <Text className="text-[11.5px] font-semibold" style={{ color: PRIMARY }}>{r.cta}</Text>
                </View>
              )}
            </Wrapper>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ upcomingTasks, systemById, systems, tasks, spentThisYear, next12mo, monthlyReserve, profile, energyChecks, onOpenSystem, onOpenAccount, onOpenEnergyAudit, onNavigate }) {
  const overdueCount = tasks.filter((t) => !t.completed && daysUntil(t.dueDate) < 0).length;

  const { passed: energyPassed, total: energyTotal } = computeEnergyScore(computeAutoChecks(systems), energyChecks);
  const recommendations = [
    {
      id: "energy-audit",
      title: "Energy audit",
      subtitle: `${energyPassed} of ${energyTotal} checks passed`,
      icon: Zap,
      highlight: true,
      onClick: onOpenEnergyAudit,
    },
    ...seedRecommendations,
  ];

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0]" contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <HomeHero
        todoCount={upcomingTasks.length}
        overdueCount={overdueCount}
        systemsCount={systems.length}
        profile={profile}
        onOpenAccount={onOpenAccount}
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

        <TodayList tasks={upcomingTasks.slice(0, 3)} systemById={systemById} />

        <RecommendedList items={recommendations} />

        <View className="mb-5">
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Financial outlook</Text>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              <Text className="text-[11px] text-stone-400">Spent this year</Text>
              <Text className="text-[18px] font-semibold text-stone-900">{money(spentThisYear)}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
              <Text className="text-[11px] text-stone-400">Next 12 months</Text>
              <Text className="text-[18px] font-semibold text-stone-900">{money(Math.round(next12mo))}</Text>
            </View>
          </View>
          <View className="rounded-xl bg-white p-3 mt-2" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <Text className="text-[11px] text-stone-400">Recommended monthly reserve</Text>
            <Text className="text-[18px] font-semibold text-stone-900">{money(monthlyReserve)}/mo</Text>
          </View>
        </View>

        <View>
          <Text className="text-[12px] font-semibold text-stone-500 mb-1">Home health</Text>
          <View className="rounded-xl bg-white px-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            {systems.map((s, i) => {
              const status = systemStatus(s, tasks);
              const meta = CATEGORY_META[s.category];
              const Icon = meta.icon;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onOpenSystem(s)}
                  className="flex-row items-center justify-between py-2.5"
                  style={{ borderBottomWidth: i < systems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
                >
                  <View className="flex-row items-center gap-2">
                    <Icon size={16} color="#5F5B50" />
                    <Text className="text-[13.5px] text-stone-800">{meta.label}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <StatusDot status={status} />
                    <ChevronRight size={15} color="#B8B4A8" />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
