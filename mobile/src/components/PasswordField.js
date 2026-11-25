import { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

// A password TextInput with a show/hide toggle — its own independent
// visibility state, so toggling one password field never also reveals
// another (e.g. confirm-password).
export default function PasswordField({ value, onChangeText, placeholder, textContentType, className }) {
  const [visible, setVisible] = useState(false);
  return (
    <View className={className} style={[{ flexDirection: "row", alignItems: "center" }, fieldStyle]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        textContentType={textContentType}
        className="flex-1 px-3 py-2.5 text-[13.5px]"
      />
      <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={{ paddingHorizontal: 10 }}>
        {visible ? <EyeOff size={17} color="#78716c" /> : <Eye size={17} color="#78716c" />}
      </Pressable>
    </View>
  );
}
