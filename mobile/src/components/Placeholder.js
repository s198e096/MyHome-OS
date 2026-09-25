import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PRIMARY } from "../lib/constants.js";

// Temporary stand-in for screens not yet ported from the web app.
export default function Placeholder({ title, backLabel }) {
  const router = useRouter();
  return (
    <View className="flex-1 bg-[#F5F8F0] px-4 pt-5">
      {backLabel && (
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">{backLabel}</Text>
        </Pressable>
      )}
      <Text className="text-[17px] font-semibold text-stone-900 mb-2">{title}</Text>
      <Text className="text-[13px] text-stone-400">Coming soon.</Text>
    </View>
  );
}
