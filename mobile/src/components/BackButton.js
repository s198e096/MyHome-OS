import { Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";

// The app's standard top-left "go back" control: a single bordered pill
// around both the chevron and the "Back" label, so it reads as one real
// tappable button rather than a floating icon+label pair. `className` lets
// callers add spacing (e.g. "mb-3") without baking margin into the shared
// component.
export default function BackButton({ onPress, disabled, className = "" }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      className={`flex-row items-center gap-1 self-start px-3 py-1.5 rounded-full bg-white active:opacity-60 ${className}`}
      style={{ borderWidth: 1, borderColor: "#E0E8D3", opacity: disabled ? 0.6 : 1 }}
    >
      <ChevronLeft size={16} color="#78716c" />
      <Text className="text-[13px] text-stone-500">Back</Text>
    </Pressable>
  );
}
