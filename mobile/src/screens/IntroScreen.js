import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, ScrollView, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Wrench, Sparkles, CheckCircle2 } from "lucide-react-native";
import { PRIMARY, HERO_BG_TOP, HERO_BG_BOTTOM, STATUS_COLOR } from "../lib/constants.js";

// Each slide's "snapshot" is a small stylized mockup built from the app's
// own design tokens (not a real screenshot, which would go stale the moment
// the UI changes) — close enough to what the screen actually looks like to
// give a true preview, while staying in sync with the app automatically.
function SystemsMock() {
  const rows = [
    { label: "Water Heater", status: "green" },
    { label: "HVAC — Outdoor Unit", status: "yellow" },
    { label: "Garage Door", status: "green" },
  ];
  return (
    <View className="rounded-2xl bg-white w-full p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
      {rows.map((r, i) => (
        <View
          key={r.label}
          className="flex-row items-center justify-between py-2"
          style={{ borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="rounded-lg p-1.5" style={{ backgroundColor: "#F5F8F0" }}>
              <Wrench size={13} color="#5F5B50" />
            </View>
            <Text className="text-[12.5px] text-stone-800">{r.label}</Text>
          </View>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[r.status] }} />
        </View>
      ))}
    </View>
  );
}

function TasksMock() {
  return (
    <View className="w-full">
      <View className="rounded-2xl bg-white flex-row overflow-hidden mb-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        {[
          { label: "To-do", value: 5 },
          { label: "Overdue", value: 2 },
          { label: "Systems", value: 9 },
        ].map((s, i) => (
          <View key={s.label} className="flex-1 items-center py-2.5" style={{ borderRightWidth: i < 2 ? 1 : 0, borderRightColor: "#F0F0EA" }}>
            <Text className="text-[15px] font-bold" style={{ color: PRIMARY }}>{s.value}</Text>
            <Text className="text-[10px] text-stone-500">{s.label}</Text>
          </View>
        ))}
      </View>
      <View className="rounded-2xl bg-white p-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <View className="flex-row items-center gap-2.5 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: "#E7EEDB" }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR.red }} />
          <Text className="text-[12.5px] text-stone-800 flex-1">Replace HVAC filter</Text>
          <Text className="text-[11px]" style={{ color: STATUS_COLOR.red }}>3 days overdue</Text>
        </View>
        <View className="flex-row items-center gap-2.5 pt-2">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR.green }} />
          <Text className="text-[12.5px] text-stone-800 flex-1">Flush water heater</Text>
          <Text className="text-[11px] text-stone-400">Due Dec 1</Text>
        </View>
      </View>
    </View>
  );
}

function ChatMock() {
  return (
    <View className="w-full">
      <View className="rounded-2xl bg-white p-3 mb-3" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
        <Text className="text-[11px] text-stone-400">Next 12 months</Text>
        <Text className="text-[18px] font-bold" style={{ color: PRIMARY }}>$1,240</Text>
      </View>
      <View className="items-end mb-2">
        <View className="rounded-2xl px-3 py-2" style={{ backgroundColor: PRIMARY, maxWidth: "80%" }}>
          <Text className="text-[12px] text-white">My water heater is making a loud noise</Text>
        </View>
      </View>
      <View className="items-start">
        <View className="rounded-2xl px-3 py-2 flex-row items-start gap-1.5" style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#E0E8D3", maxWidth: "85%" }}>
          <Sparkles size={13} color={PRIMARY} style={{ marginTop: 1 }} />
          <Text className="text-[12px] text-stone-700">That&apos;s usually sediment buildup — here&apos;s how to check...</Text>
        </View>
      </View>
    </View>
  );
}

const SLIDES = [
  {
    key: "systems",
    title: "Every system, in one place",
    body: "Track your HVAC, water heater, appliances and more — with install dates, warranties, and expected lifespan.",
    Mock: SystemsMock,
  },
  {
    key: "tasks",
    title: "Never miss maintenance",
    body: "Get reminded before small issues become expensive ones, and see what's overdue at a glance.",
    Mock: TasksMock,
  },
  {
    key: "chat",
    title: "Know the cost — and ask AI",
    body: "See your yearly spending and what's forecasted ahead, and chat with an AI assistant that already knows your home.",
    Mock: ChatMock,
  },
];

const AUTO_ADVANCE_MS = 4500;

export default function IntroScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const bob = useRef(new Animated.Value(0)).current;

  // A gentle continuous float on each slide's icon — motion that doesn't
  // depend on the user swiping, so the page doesn't feel static even if
  // they just sit and read.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  // Auto-advances through the slides, but a manual swipe (handled by
  // onMomentumScrollEnd below, which also calls goTo) resets this timer
  // rather than fighting the user's own scroll.
  useEffect(() => {
    const timer = setTimeout(() => {
      goTo(index < SLIDES.length - 1 ? index + 1 : 0);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo is stable enough here; re-running only on index change is the point
  }, [index]);

  function goTo(next) {
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  }

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <LinearGradient colors={[HERO_BG_TOP, HERO_BG_BOTTOM]} style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }}>
        <View className="flex-row items-center justify-between px-5 mb-2">
          <View className="flex-row items-center gap-2">
            <View className="rounded-xl items-center justify-center" style={{ width: 30, height: 30, backgroundColor: PRIMARY }}>
              <CheckCircle2 size={16} color="white" />
            </View>
            <Text className="text-[15px] font-bold" style={{ color: PRIMARY }}>MyHouse OS</Text>
          </View>
          <Pressable onPress={onDone} hitSlop={8}>
            <Text className="text-[13px] font-semibold" style={{ color: "#3B5169" }}>Skip</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {SLIDES.map(({ key, title, body, Mock }) => (
            <View key={key} style={{ width, paddingHorizontal: 28 }} className="items-center justify-center">
              <Animated.View style={{ transform: [{ translateY }], marginBottom: 22, width: "100%" }}>
                <Mock />
              </Animated.View>
              <Text className="text-[21px] font-bold text-center mb-2" style={{ color: PRIMARY }}>{title}</Text>
              <Text className="text-[13.5px] text-center" style={{ color: "#3B5169", lineHeight: 19 }}>{body}</Text>
            </View>
          ))}
        </ScrollView>

        <View className="flex-row items-center justify-center gap-1.5 mb-5">
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? PRIMARY : "rgba(22,36,15,0.25)",
              }}
            />
          ))}
        </View>

        <View className="px-5">
          <Pressable
            onPress={() => (index < SLIDES.length - 1 ? goTo(index + 1) : onDone())}
            className="w-full py-3.5 rounded-2xl items-center"
            style={{ backgroundColor: PRIMARY }}
          >
            <Text className="text-white text-[14.5px] font-semibold">
              {index < SLIDES.length - 1 ? "Next" : "Get started"}
            </Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
