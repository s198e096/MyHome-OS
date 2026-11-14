import { ScrollView, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lock, Check } from "lucide-react-native";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR } from "../lib/constants.js";
import TutorialTip, { Spotlight } from "../components/TutorialTip.js";

const WHAT_YOU_GET = [
  "What you've spent this year, by system",
  "A 12-month forecast of upcoming replacements",
  "A recommended monthly reserve to set aside",
  "A full expense log you can filter by year",
];

// What a Free-plan user sees in place of the Costs tab (and every page under
// it): what the page does and a way to the plans. Also stands in for the
// Costs step of the guided tutorial, which would otherwise have nowhere to
// show its "Next" button.
export default function LockedCostsScreen({ onSeePlans, tutorial }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Text className="text-[17px] font-semibold text-stone-900 mb-3">Costs</Text>

      <Spotlight active={!!tutorial}>
        <View className="rounded-2xl bg-white p-5 items-center" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <View className="items-center justify-center rounded-full mb-3" style={{ width: 52, height: 52, backgroundColor: ACCENT_YELLOW }}>
            <Lock size={22} color={PRIMARY} />
          </View>
          <Text className="text-[16px] font-semibold text-stone-900 mb-1 text-center">Costs is on the paid plans</Text>
          <Text className="text-[12.5px] text-stone-500 text-center mb-4" style={{ lineHeight: 18 }}>
            Upgrade to track what your home costs you and plan for what&apos;s coming.
          </Text>

          <View className="self-stretch flex-col gap-2 mb-5">
            {WHAT_YOU_GET.map((line) => (
              <View key={line} className="flex-row items-start gap-2">
                <Check size={14} color={STATUS_COLOR.green} style={{ marginTop: 2 }} />
                <Text className="text-[12.5px] text-stone-700 flex-1" style={{ lineHeight: 18 }}>{line}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onSeePlans} className="self-stretch rounded-lg py-2.5 items-center" style={{ backgroundColor: PRIMARY }}>
            <Text className="text-[13px] font-semibold text-white">See plans</Text>
          </Pressable>
        </View>
      </Spotlight>

      {!!tutorial && (
        <TutorialTip
          step={tutorial.step}
          total={tutorial.total}
          text="On the paid plans, Costs shows what you've spent, a 12-month forecast, and how much to set aside monthly for upcoming replacements."
          onNext={tutorial.next}
          onSkip={tutorial.skip}
          className="mt-4"
        />
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
