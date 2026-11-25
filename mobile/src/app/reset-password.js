import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { PRIMARY, STATUS_COLOR } from "../lib/constants.js";
import { supabase } from "../lib/supabase.js";
import { checkPasswordReuse } from "../lib/db.js";
import { useSession } from "../lib/auth-context.js";
import PasswordField from "../components/PasswordField.js";

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

    // updateUser() has no built-in check for this — without asking first, a
    // password reset that just re-submits the same old password would
    // silently "succeed" at changing nothing.
    try {
      const { sameAsOld } = await checkPasswordReuse(password);
      if (sameAsOld) {
        setLoading(false);
        return setError("You cannot use your old password. Choose a different one.");
      }
    } catch {
      setLoading(false);
      return setError("Couldn't verify your password. Try again.");
    }

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
          <Text className="text-[12.5px] text-stone-400 mb-4">MyHouse OS</Text>

          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            textContentType="newPassword"
            className="w-full mb-2 rounded-lg"
          />
          <PasswordField
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            textContentType="newPassword"
            className="w-full mb-3 rounded-lg"
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
