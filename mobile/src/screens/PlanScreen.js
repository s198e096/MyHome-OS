import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, ACCENT_YELLOW, PLANS } from "../lib/constants.js";

export default function PlanScreen({ currentPlan, onBack, onSelectPlan, onManageBilling }) {
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  async function handleSelect(planId) {
    setError("");
    setLoadingPlanId(planId);
    try {
      await onSelectPlan(planId);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function handleManageBilling() {
    setError("");
    setLoadingPlanId("manage");
    try {
      await onManageBilling();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
        <ChevronLeft size={16} color="#78716c" />
        <Text className="text-[13px] text-stone-500">Account</Text>
      </Pressable>

      <Text className="text-[17px] font-semibold text-stone-900 mb-1">Choose your plan</Text>
      <Text className="text-[12.5px] text-stone-500 mb-4">Switch or cancel anytime.</Text>

      <View className="flex-col gap-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isLoading = loadingPlanId === plan.id;
          return (
            <View
              key={plan.id}
              className="rounded-xl p-3.5"
              style={{
                backgroundColor: plan.highlight ? ACCENT_YELLOW : "white",
                borderWidth: plan.highlight ? 0 : 1,
                borderColor: "#E0E8D3",
              }}
            >
              <View className="flex-row items-baseline justify-between mb-1">
                <Text className="text-[15px] font-bold text-stone-900">{plan.name}</Text>
                {plan.highlight && (
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: PRIMARY }}>
                    <Text className="text-[10.5px] font-semibold text-white">Best value</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-baseline gap-1 mb-2">
                <Text className="text-[22px] font-bold" style={{ color: PRIMARY }}>{plan.price}</Text>
                {plan.period && <Text className="text-[12px] text-stone-500">{plan.period}</Text>}
              </View>

              <View className="flex-col gap-1 mb-3">
                {plan.features.map((f) => (
                  <View key={f} className="flex-row items-center gap-1.5">
                    <Check size={13} color={STATUS_COLOR.green} />
                    <Text className="text-[12.5px] text-stone-700">{f}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => handleSelect(plan.id)}
                disabled={isCurrent || loadingPlanId !== null}
                className="w-full py-2 rounded-lg items-center"
                style={
                  isCurrent
                    ? { backgroundColor: "#EFEDE6" }
                    : { backgroundColor: PRIMARY, opacity: loadingPlanId && !isLoading ? 0.6 : 1 }
                }
              >
                <Text className="text-[13px] font-semibold" style={{ color: isCurrent ? "#9C978C" : "white" }}>
                  {isCurrent ? "Current plan" : isLoading ? "Redirecting..." : "Choose plan"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {error && (
        <Text className="text-[12px] text-center mt-3" style={{ color: STATUS_COLOR.red }}>
          {error}
        </Text>
      )}

      {currentPlan !== "free" && (
        <Pressable onPress={handleManageBilling} disabled={loadingPlanId !== null} className="w-full mt-4 items-center">
          <Text className="text-[12.5px]" style={{ color: PRIMARY }}>
            {loadingPlanId === "manage" ? "Redirecting..." : "Manage billing"}
          </Text>
        </Pressable>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
