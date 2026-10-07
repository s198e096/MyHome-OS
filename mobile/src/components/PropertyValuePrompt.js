import { Modal, View, Text, Pressable } from "react-native";
import { PRIMARY } from "../lib/constants.js";
import { money } from "../lib/forecast.js";

// Shown when the monthly RentCast refresh finds a new estimate for a home
// value the user had manually overridden — lets them keep their number or
// switch to the refreshed one, instead of it being silently replaced.
export default function PropertyValuePrompt({ currentValue, pendingValue, onKeep, onAccept }) {
  return (
    <Modal transparent animationType="fade" visible>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View className="w-full rounded-xl bg-white p-4" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
          <Text className="text-[15px] font-semibold text-stone-900 mb-1.5">Updated home value available</Text>
          <Text className="text-[12.5px] text-stone-500 mb-4 leading-relaxed">
            RentCast now estimates your home at {money(pendingValue)}. You set it to {money(currentValue)} yourself — keep your value, or switch to the new estimate?
          </Text>
          <Pressable onPress={onAccept} className="w-full py-2.5 rounded-lg items-center mb-2" style={{ backgroundColor: PRIMARY }}>
            <Text className="text-[13.5px] font-semibold text-white">Use {money(pendingValue)}</Text>
          </Pressable>
          <Pressable onPress={onKeep} className="w-full py-2.5 rounded-lg items-center" style={{ borderWidth: 1, borderColor: "#E0E8D3" }}>
            <Text className="text-[13.5px] font-semibold text-stone-700">Keep my value</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
