import { View, Text, TextInput } from "react-native";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

// Adds thousands separators for display only — callers still get/set the
// plain numeric string ("1200.5"), so existing parseFloat/parseInt save
// logic needs no changes.
function formatWithCommas(raw) {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}

// Strips everything but digits and a single decimal point, so pasted text
// like "$1,200.50" (or the "$" prefix itself, on platforms that include it
// in copy/paste) becomes the plain "1200.50" that formatWithCommas and the
// caller's parseFloat/parseInt expect.
function sanitize(text) {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

// A TextInput for a dollar amount: a "$" prefix plus comma-formatted digits
// as the user types, while the value/onChangeText contract stays a plain
// numeric string — a drop-in replacement for a plain money TextInput.
export default function CurrencyInput({ value, onChangeText, placeholder, className, inputStyle, ...rest }) {
  return (
    <View className={className} style={[{ flexDirection: "row", alignItems: "center" }, fieldStyle]}>
      <Text className="text-[13.5px]" style={{ color: "#78716c", marginLeft: 10 }}>$</Text>
      <TextInput
        value={formatWithCommas(value)}
        onChangeText={(text) => onChangeText(sanitize(text))}
        placeholder={placeholder}
        inputMode="decimal"
        className="text-[13.5px]"
        style={[{ flex: 1, paddingVertical: 8, paddingHorizontal: 6 }, inputStyle]}
        {...rest}
      />
    </View>
  );
}
