import { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, ACCENT_YELLOW, PLANS } from "../lib/constants.js";
import BackButton from "../components/BackButton.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

function formatCancelDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// What to tell the user when checkout / billing can't open. The real cause
// is always shown underneath (not just while developing), since the generic
// line alone hides whether it's the session, the network or the Stripe
// setup — same as the report-checkout flow in account/index.js.
function billingErrorText(err) {
  const base =
    err?.status === 401 ? "Your session expired. Sign out and back in, then try again."
    : err?.network ? "Couldn't reach the server. Check your connection and try again."
    : "Something went wrong. Try again.";
  const detail = err?.detail || err?.message;
  return detail ? `${base}
[${err?.status ?? "no status"}] ${String(detail).slice(0, 300)}` : base;
}

export default function PlanScreen({ currentPlan, onBack, onSelectPlan, onManageBilling, onCancelPlan }) {
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const insets = useSafeAreaInsets();

  function handleSelect(planId) {
    setError("");
    setInfo("");
    // Switching to Free cancels a real subscription (or, for a Lifetime
    // purchase, drops paid features right away) — always confirm first,
    // rather than treating it like picking any other plan.
    if (planId === "free") {
      setConfirmingCancel(true);
      return;
    }
    runSelect(planId);
  }

  async function runSelect(planId) {
    setLoadingPlanId(planId);
    try {
      await onSelectPlan(planId);
    } catch (err) {
      setError(billingErrorText(err));
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function handleConfirmCancel() {
    setConfirmingCancel(false);
    setLoadingPlanId("free");
    try {
      const result = await onCancelPlan();
      setInfo(
        result?.immediate
          ? "You're now on the Free plan."
          : `Your plan will switch to Free on ${formatCancelDate(result.cancelAt)} — you'll keep your current plan's features until then.`
      );
    } catch (err) {
      setError(billingErrorText(err));
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function handleManageBilling() {
    setError("");
    setInfo("");
    setLoadingPlanId("manage");
    try {
      await onManageBilling();
    } catch (err) {
      setError(billingErrorText(err));
    } finally {
      setLoadingPlanId(null);
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
      <BackButton onPress={onBack} className="mb-3" />

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
                  {isCurrent ? "Current plan" : isLoading ? (plan.id === "free" ? "Canceling..." : "Redirecting...") : "Choose plan"}
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
      {info && (
        <Text className="text-[12px] text-center mt-3" style={{ color: STATUS_COLOR.green }}>
          {info}
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

      <Modal transparent animationType="fade" visible={confirmingCancel} onRequestClose={() => setConfirmingCancel(false)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View className="w-full rounded-xl bg-white p-4" style={fieldStyle}>
            <Text className="text-[15px] font-semibold text-stone-900 mb-1.5">Cancel your plan?</Text>
            <Text className="text-[12.5px] text-stone-500 mb-4 leading-relaxed">
              {currentPlan === "lifetime"
                ? "This switches you to the Free plan right away. Your Lifetime purchase isn't refunded."
                : "This cancels your recurring payment and switches you to the Free plan. You'll keep your current plan's features until the end of this billing period, then move to Free automatically."}
            </Text>
            <Pressable onPress={handleConfirmCancel} className="w-full py-2.5 rounded-lg items-center mb-2 active:opacity-60" style={{ backgroundColor: PRIMARY }}>
              <Text className="text-[13.5px] font-semibold text-white">Yes, cancel my plan</Text>
            </Pressable>
            <Pressable onPress={() => setConfirmingCancel(false)} className="w-full py-2.5 rounded-lg items-center active:opacity-60" style={fieldStyle}>
              <Text className="text-[13.5px] font-semibold text-stone-700">No, keep my plan</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
