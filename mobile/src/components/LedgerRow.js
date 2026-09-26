import { View, Text, Pressable } from "react-native";
import { PRIMARY } from "../lib/constants.js";

export default function LedgerRow({ label, sub, value, valueColor, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className="flex-row items-baseline justify-between py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: "#E7EEDB" }}>
      <View className="flex-1 min-w-0">
        <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{label}</Text>
        {sub && <Text className="text-[11.5px] text-stone-400">{sub}</Text>}
      </View>
      <Text className="text-[13.5px] pl-2" style={{ color: valueColor || PRIMARY, fontWeight: "600" }}>
        {value}
      </Text>
    </Wrapper>
  );
}
