import { View, Text, Pressable } from "react-native";
import { PRIMARY, ACCENT_YELLOW } from "../lib/constants.js";

// Wraps the real control the current tutorial step is pointing at with a
// highlight ring — the tip itself (below) explains it, this is what makes
// it look like the tour is pointing at an actual piece of the UI.
export function Spotlight({ active, children, style }) {
  if (!active) return children;
  return (
    <View style={[{ borderRadius: 16, borderWidth: 2, borderColor: ACCENT_YELLOW, padding: 3 }, style]}>
      {children}
    </View>
  );
}

// The callout itself: step dots, Skip, and Next/Done. Rendered inline right
// next to whatever it's explaining (not a floating overlay), so it always
// sits with the real control instead of needing to measure its position.
export default function TutorialTip({ step, total, text, onNext, onSkip, className }) {
  const isLast = step === total - 1;
  return (
    <View className={className} style={{ borderRadius: 14, backgroundColor: PRIMARY, padding: 12 }}>
      <Text className="text-[12.5px] text-white mb-2.5" style={{ lineHeight: 18 }}>{text}</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 14 : 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: i === step ? "white" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={onSkip} hitSlop={8}>
            <Text className="text-[11.5px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Skip Tutorial</Text>
          </Pressable>
          <Pressable onPress={onNext} className="rounded-full px-3 py-1.5" style={{ backgroundColor: "white" }}>
            <Text className="text-[11.5px] font-semibold" style={{ color: PRIMARY }}>{isLast ? "Done" : "Next"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
