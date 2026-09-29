import { InputAccessoryView, View, Pressable, Keyboard, Platform } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { PRIMARY } from "../lib/constants.js";

// iOS's system keyboard has no built-in way to dismiss it when a TextInput
// has no return-key action wired up, so screens with several stacked fields
// need their own "done" bar. Android's keyboard already has a dismiss
// affordance (the back gesture/button), so this renders nothing there.
export const KEYBOARD_ACCESSORY_ID = "myhome-os-keyboard-done";

export default function KeyboardDoneBar() {
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          backgroundColor: "#F5F8F0",
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderTopWidth: 1,
          borderTopColor: "#E0E8D3",
        }}
      >
        <Pressable onPress={() => Keyboard.dismiss()} hitSlop={8} style={{ padding: 6 }}>
          <ChevronDown size={22} color={PRIMARY} />
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}
