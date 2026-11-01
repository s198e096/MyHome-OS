import { View, Text } from "react-native";
import { TriangleAlert } from "lucide-react-native";
import { STATUS_COLOR, STATUS_BG } from "../lib/constants.js";

// The note shown under a field when checkExpense() (lib/expense-check.js) flags
// what was typed: amber for "higher than usual", red for "very high" and for an
// amount that can't be saved. Renders nothing when the amount looks fine.
export default function FieldWarning({ check }) {
  if (!check) return null;
  const strong = check.level !== "check";
  const color = strong ? STATUS_COLOR.red : STATUS_COLOR.yellow;
  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-start gap-2 rounded-lg px-3 py-2 mb-2"
      style={{ backgroundColor: strong ? STATUS_BG.red : STATUS_BG.yellow }}
    >
      <TriangleAlert size={14} color={color} style={{ marginTop: 2 }} />
      <Text className="flex-1 text-[12px]" style={{ color, lineHeight: 17 }}>{check.message}</Text>
    </View>
  );
}
