import { View, Text, Pressable } from "react-native";
import { PRIMARY, ACCENT_YELLOW, FREE_AI_FILL_LIMIT } from "../lib/constants.js";
import { useAiFill } from "../lib/ai-fill.js";

// Sits under an AI auto-fill button on the Free plan: how many free scans are
// left, or - once they're gone - why the button is off and how to get more.
// Renders nothing on a paid plan. `limitHit` forces the "used up" state for
// when the server has just said so but the count hasn't been re-read yet.
// `onUpgrade` is optional (onboarding can't navigate away to the plans page).
export default function AiFillNote({ limitHit, onUpgrade }) {
  const { isFreePlan, left, exhausted } = useAiFill();
  if (!isFreePlan) return null;

  if (!exhausted && !limitHit) {
    return (
      <Text className="text-[11.5px] text-stone-400 mb-2">
        {left} of {FREE_AI_FILL_LIMIT} free AI auto-fills left
      </Text>
    );
  }

  return (
    <View className="rounded-lg px-3 py-2.5 mb-2" style={{ backgroundColor: ACCENT_YELLOW }}>
      <Text className="text-[12px]" style={{ color: PRIMARY, lineHeight: 17 }}>
        You&apos;ve used all {FREE_AI_FILL_LIMIT} free AI auto-fills. Fill in the details yourself, or upgrade for unlimited auto-fill.
      </Text>
      {onUpgrade && (
        <Pressable onPress={onUpgrade} className="self-start rounded-full px-3.5 py-1.5 mt-2" style={{ backgroundColor: PRIMARY }}>
          <Text className="text-[12px] font-semibold text-white">See plans</Text>
        </Pressable>
      )}
    </View>
  );
}
