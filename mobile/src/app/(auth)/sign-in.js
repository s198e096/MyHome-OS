import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Home, Eye, EyeOff } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR } from "../../lib/constants.js";
import { supabase } from "../../lib/supabase.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

// A password TextInput with a show/hide toggle — its own independent
// visibility state, so toggling the password field never also reveals
// confirm-password.
function PasswordField({ value, onChangeText, placeholder, textContentType, className }) {
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

export default function SignIn() {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function handleSubmit() {
    setError("");
    setNotice("");
    if (!email.trim()) return setError("Enter your email.");

    if (mode === "forgot") {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());
      setLoading(false);
      if (resetError) return setError(resetError.message);
      return setNotice("Check your email for a password reset link.");
    }

    if (!password) return setError("Enter your password.");

    if (mode === "signup") {
      if (!firstName.trim()) return setError("Enter your first name.");
      if (!lastName.trim()) return setError("Enter your last name.");
      if (!phone.trim()) return setError("Enter your phone number.");
      if (password !== confirmPassword) return setError("Passwords don't match.");
    }

    setLoading(true);
    const { error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() } },
          });
    setLoading(false);

    if (authError) return setError(authError.message);
    if (mode === "signup") setNotice("Check your email to confirm your account.");
  }

  const titles = { signin: "Sign in", signup: "Create account", forgot: "Reset password" };
  const submitLabels = { signin: "Sign in", signup: "Sign up", forgot: "Send reset link" };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#F5F8F0" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <View className="px-6">
          <View className="items-center mb-7">
            <View className="rounded-2xl items-center justify-center mb-3" style={{ width: 56, height: 56, backgroundColor: PRIMARY }}>
              <Home size={26} color="white" />
            </View>
            <Text className="text-[22px] font-bold text-stone-900">MyHome OS</Text>
            <Text className="text-[13.5px] text-stone-400 mt-1">{titles[mode]}</Text>
          </View>

          {mode === "signup" && (
            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <Text className="text-[11px] text-stone-500 mb-1">First name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  textContentType="givenName"
                  className="w-full px-3 py-2.5 rounded-lg text-[13.5px]"
                  style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] text-stone-500 mb-1">Last name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  textContentType="familyName"
                  className="w-full px-3 py-2.5 rounded-lg text-[13.5px]"
                  style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
                />
              </View>
            </View>
          )}

          <Text className="text-[11px] text-stone-500 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            className="w-full mb-2 px-3 py-2.5 rounded-lg text-[13.5px]"
            style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
          />
          {mode === "signup" && (
            <>
              <Text className="text-[11px] text-stone-500 mb-1">Phone number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                className="w-full mb-2 px-3 py-2.5 rounded-lg text-[13.5px]"
                style={{ borderWidth: 1, borderColor: "#E0E8D3" }}
              />
            </>
          )}
          {mode !== "forgot" && (
            <>
              <Text className="text-[11px] text-stone-500 mb-1">Password</Text>
              <PasswordField
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                textContentType={mode === "signin" ? "password" : "newPassword"}
                className="w-full mb-3 rounded-lg"
              />
            </>
          )}
          {mode === "signup" && (
            <>
              <Text className="text-[11px] text-stone-500 mb-1">Confirm password</Text>
              <PasswordField
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                textContentType="newPassword"
                className="w-full mb-3 rounded-lg"
              />
            </>
          )}

          {mode === "signin" && (
            <Pressable onPress={() => switchMode("forgot")} className="mb-3 -mt-1">
              <Text className="text-right text-[12px]" style={{ color: PRIMARY }}>
                Forgot password?
              </Text>
            </Pressable>
          )}

          {error ? <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text> : null}
          {notice ? <Text className="text-[12px] mb-2" style={{ color: STATUS_COLOR.green }}>{notice}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg mb-3 items-center"
            style={{ backgroundColor: PRIMARY, opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white text-[13.5px] font-semibold">{loading ? "Please wait..." : submitLabels[mode]}</Text>
          </Pressable>

          {mode === "forgot" ? (
            <Pressable onPress={() => switchMode("signin")}>
              <Text className="text-center text-[12.5px] text-stone-500">Back to sign in</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}>
              <Text className="text-center text-[12.5px] text-stone-500">
                {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
