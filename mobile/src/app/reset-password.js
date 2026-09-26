import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { supabase } from "../lib/supabase.js";
import { useSession } from "../lib/auth-context.js";

export default function ResetPassword() {
  const { clearPasswordRecovery } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) return setError(updateError.message);
    clearPasswordRecovery();
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#F5F8F0" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <View className="px-6">
          <Text className="text-[17px] font-semibold text-stone-900 mb-1">Set a new password</Text>
          <Text className="text-[12.5px] text-stone-400 mb-4">MyHome OS</Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            className="w-full mb-2 px-3 py-2.5 rounded-lg text-[13.5px]"
            style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
          />
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            className="w-full mb-3 px-3 py-2.5 rounded-lg text-[13.5px]"
            style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
          />

          {error ? <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg items-center"
            style={{ backgroundColor: PRIMARY, opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-[13.5px] font-semibold">{loading ? "Saving..." : "Save new password"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
