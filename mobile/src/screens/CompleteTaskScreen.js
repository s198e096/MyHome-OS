import { useState } from "react";
import { KeyboardAvoidingView, Platform, View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronDown } from "lucide-react-native";
import { PRIMARY, systemName } from "../lib/constants.js";
import KeyboardDoneBar, { KEYBOARD_ACCESSORY_ID } from "../components/KeyboardDoneBar.js";
import SelectModal from "../components/SelectModal.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

const TIME_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

// Converts a time-spent value in whatever unit was chosen into hours, since
// that's what's stored.
function toHours(value, unit) {
  const n = Number(value);
  if (!value || Number.isNaN(n)) return null;
  if (unit === "minutes") return n / 60;
  if (unit === "days") return n * 24;
  return n;
}

function ChoicePressable({ label, active, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-1 py-2.5 rounded-lg items-center"
      style={{ backgroundColor: active ? PRIMARY : "white", borderWidth: 1, borderColor: active ? PRIMARY : "#E0E8D3" }}
    >
      <Text className="text-[13px] font-semibold" style={{ color: active ? "white" : "#5F5B50" }}>{label}</Text>
    </Pressable>
  );
}

// Reached by tapping the checkbox on an open task — asks whether completing
// it cost anything, and if so, splits that into parts/labor plus either
// time spent (DIY) or who was hired (vendor), before actually marking the
// task done. "No cost" completes immediately with no further questions.
export default function CompleteTaskScreen({ task, sys, onBack, onComplete }) {
  const insets = useSafeAreaInsets();
  const [hasCost, setHasCost] = useState(null);
  const [diy, setDiy] = useState(null);
  const [partsCost, setPartsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [timeUnitDropdownOpen, setTimeUnitDropdownOpen] = useState(false);
  const [vendor, setVendor] = useState("");
  const [saving, setSaving] = useState(false);

  async function finish(cost) {
    setSaving(true);
    try {
      await onComplete(cost);
    } finally {
      setSaving(false);
    }
  }

  function chooseNoCost() {
    setHasCost(false);
    finish(null);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        style={{ paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Tasks</Text>
        </Pressable>

        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Complete task</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4" numberOfLines={1}>
          {task.title}{sys ? ` · ${systemName(sys)}` : ""}
        </Text>

        <Text className="text-[13px] font-semibold text-stone-800 mb-2">Did this cost anything?</Text>
        <View className="flex-row gap-2 mb-4">
          <ChoicePressable label="No cost" active={hasCost === false} onPress={chooseNoCost} disabled={saving} />
          <ChoicePressable label="Yes, add cost" active={hasCost === true} onPress={() => setHasCost(true)} disabled={saving} />
        </View>

        {hasCost === true && (
          <>
            <Text className="text-[13px] font-semibold text-stone-800 mb-2">Did you do it yourself, or hire someone?</Text>
            <View className="flex-row gap-2 mb-4">
              <ChoicePressable label="I did it myself" active={diy === true} onPress={() => setDiy(true)} disabled={saving} />
              <ChoicePressable label="I hired someone" active={diy === false} onPress={() => setDiy(false)} disabled={saving} />
            </View>

            {diy !== null && (
              <>
                <View className="flex-row gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="text-[11px] text-stone-500 mb-1">Parts cost ($)</Text>
                    <TextInput
                      value={partsCost}
                      onChangeText={setPartsCost}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full px-3 py-2 rounded-lg text-[13.5px]"
                      style={fieldStyle}
                      inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-stone-500 mb-1">Labor cost ($)</Text>
                    <TextInput
                      value={laborCost}
                      onChangeText={setLaborCost}
                      placeholder="0"
                      inputMode="decimal"
                      className="w-full px-3 py-2 rounded-lg text-[13.5px]"
                      style={fieldStyle}
                      inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                    />
                  </View>
                </View>

                {diy ? (
                  <>
                    <View className="mb-4">
                      <Text className="text-[11px] text-stone-500 mb-1">Time spent</Text>
                      <View className="flex-row gap-2">
                        <TextInput
                          value={timeSpent}
                          onChangeText={setTimeSpent}
                          placeholder="e.g. 2"
                          inputMode="decimal"
                          className="flex-1 px-3 py-2 rounded-lg text-[13.5px]"
                          style={fieldStyle}
                          inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                        />
                        <Pressable
                          onPress={() => setTimeUnitDropdownOpen(true)}
                          className="flex-row items-center justify-between px-3 py-2 rounded-lg"
                          style={[fieldStyle, { width: 120 }]}
                        >
                          <Text className="text-[13.5px] text-stone-800">{TIME_UNITS.find((u) => u.value === timeUnit)?.label}</Text>
                          <ChevronDown size={14} color="#78716c" />
                        </Pressable>
                      </View>
                      <SelectModal
                        visible={timeUnitDropdownOpen}
                        title="Time unit"
                        options={TIME_UNITS}
                        selectedValue={timeUnit}
                        onSelect={(value) => {
                          setTimeUnit(value);
                          setTimeUnitDropdownOpen(false);
                        }}
                        onClose={() => setTimeUnitDropdownOpen(false)}
                      />
                    </View>

                    <View className="mb-4">
                      <Text className="text-[11px] text-stone-500 mb-1">Parts vendor</Text>
                      <TextInput
                        value={vendor}
                        onChangeText={setVendor}
                        placeholder="e.g. Home Depot"
                        className="w-full px-3 py-2 rounded-lg text-[13.5px]"
                        style={fieldStyle}
                        inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                      />
                    </View>
                  </>
                ) : (
                  <View className="mb-4">
                    <Text className="text-[11px] text-stone-500 mb-1">Vendor name</Text>
                    <TextInput
                      value={vendor}
                      onChangeText={setVendor}
                      placeholder="e.g. ABC Plumbing"
                      className="w-full px-3 py-2 rounded-lg text-[13.5px]"
                      style={fieldStyle}
                      inputAccessoryViewID={KEYBOARD_ACCESSORY_ID}
                    />
                  </View>
                )}

                <Pressable
                  onPress={() => finish({ partsCost, laborCost, diy, timeSpentHours: toHours(timeSpent, timeUnit), vendor })}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg items-center mb-6"
                  style={{ backgroundColor: PRIMARY, opacity: saving ? 0.6 : 1 }}
                >
                  <Text className="text-[13.5px] font-semibold text-white">{saving ? "Saving..." : "Complete task"}</Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
      <KeyboardDoneBar />
    </KeyboardAvoidingView>
  );
}
