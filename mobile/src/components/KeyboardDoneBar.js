import { useEffect, useState } from "react";
import { View, Pressable, Keyboard, Platform } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { PRIMARY } from "../lib/constants.js";

// A single bar, mounted once at the app root, that appears right above the
// software keyboard whenever it's open, with a button to dismiss it — so no
// screen or field needs its own wiring, and the user never has to tap
// elsewhere just to put the keyboard away. Tracks the keyboard directly via
// Keyboard events (height + show/hide) rather than InputAccessoryView,
// which is iOS-only, so this works the same on Android.
export default function KeyboardDoneBar() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates?.height || 0));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (keyboardHeight === 0) return null;

  // iOS overlays the keyboard on top of the (unchanged) window, so the bar
  // needs to be pushed up by its height manually. Android's default
  // windowSoftInputMode ("resize") instead shrinks the window itself to
  // exclude the keyboard, so the root view is already that much shorter —
  // offsetting by the height again there would leave a gap above the keys.
  const bottomOffset = Platform.OS === "ios" ? keyboardHeight : 0;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: bottomOffset, zIndex: 100 }}>
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
    </View>
  );
}
