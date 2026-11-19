import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TriangleAlert, X } from "lucide-react-native";
import { PRIMARY, STATUS_COLOR, STATUS_BG, PLANS } from "../lib/constants.js";
import BackButton from "../components/BackButton.js";

// The word the user has to type. Compared ignoring case and surrounding
// spaces, so "Delete" (the phone capitalizes the first letter) counts.
const CONFIRM_WORD = "delete";

// What to tell the user when the deletion didn't go through. In development
// (Expo Go) the server's own message is shown underneath, since it says why
// (e.g. a Stripe problem); a shipped build only shows the friendly line.
function deleteErrorText(err) {
  const base =
    err?.status === 401 ? "Your session expired. Sign out and back in, then try again."
    : err?.network ? "Couldn't reach the server. Check your connection and try again."
    : "Couldn't delete your account. Nothing was deleted - try again.";
  const detail = err?.detail || err?.message;
  return __DEV__ && detail ? `${base}\n[${err?.status ?? "no status"}] ${String(detail).slice(0, 300)}` : base;
}

// "3 systems, 12 tasks and 2 documents" - only the kinds the user has any of.
function summarize(counts) {
  const parts = [
    [counts.systems, "system"],
    [counts.tasks, "task"],
    [counts.expenses, "expense"],
    [counts.documents, "document"],
  ]
    .filter(([n]) => n > 0)
    .map(([n, word]) => `${n} ${word}${n === 1 ? "" : "s"}`);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function Loss({ children }) {
  return (
    <View className="flex-row items-start gap-2 mb-2">
      <X size={14} color={STATUS_COLOR.red} style={{ marginTop: 2 }} />
      <Text className="text-[12.5px] text-stone-800 flex-1" style={{ lineHeight: 18 }}>{children}</Text>
    </View>
  );
}

// Permanent account deletion. Two safeguards before the button works: a plain
// list of exactly what will be lost (including how much the user has saved,
// and any paid plan that will end), and a typed confirmation. Rendered from
// props only - the route decides what "delete" actually does.
export default function DeleteAccountScreen({ email, plan, counts, onBack, onDelete }) {
  const insets = useSafeAreaInsets();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;
  const planName = PLANS.find((p) => p.id === plan)?.name;
  const hasPaidPlan = !!plan && plan !== "free";
  const saved = summarize(counts);

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setError("");
    setDeleting(true);
    try {
      await onDelete();
      // Success signs the user out, which leaves this screen; nothing to do.
    } catch (err) {
      setError(deleteErrorText(err));
      setDeleting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        style={{ paddingTop: insets.top + 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={onBack} disabled={deleting} className="mb-3" />

        <View className="flex-row items-center gap-2 mb-1">
          <TriangleAlert size={20} color={STATUS_COLOR.red} />
          <Text className="text-[17px] font-semibold text-stone-900">Delete your account</Text>
        </View>
        {!!email && <Text className="text-[12.5px] text-stone-500 mb-4">{email}</Text>}

        <View className="rounded-xl p-3.5 mb-4" style={{ backgroundColor: STATUS_BG.red }}>
          <Text className="text-[13px] font-semibold mb-2.5" style={{ color: STATUS_COLOR.red }}>
            This is permanent and can&apos;t be undone.
          </Text>
          <Loss>
            Your property profile{saved ? ` and everything you've saved: ${saved}` : " and everything you've saved"}.
          </Loss>
          <Loss>All the photos, receipts, warranty documents and manuals you uploaded.</Loss>
          <Loss>Your Ask Anything conversations on this phone.</Loss>
          {hasPaidPlan && (
            <Loss>
              {plan === "lifetime"
                ? `Your ${planName} plan ends with the account.`
                : `Your ${planName} subscription is cancelled right away, so you won't be billed again.`}
            </Loss>
          )}
          <Text className="text-[12px] text-stone-600 mt-1" style={{ lineHeight: 17 }}>
            We can&apos;t recover anything afterwards. You could create a new account with the same email, but it would start empty.
          </Text>
        </View>

        <Text className="text-[13px] text-stone-800 mb-1.5">
          To confirm, type <Text className="font-bold">{CONFIRM_WORD}</Text> below.
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          editable={!deleting}
          placeholder={CONFIRM_WORD}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
          onSubmitEditing={handleDelete}
          className="w-full px-3 py-2.5 rounded-lg text-[14px] mb-3"
          style={{ borderWidth: 1, borderColor: confirmed ? STATUS_COLOR.red : "#E0E8D3", backgroundColor: "white" }}
        />

        {!!error && <Text className="text-[12px] mb-3" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

        <Pressable
          onPress={handleDelete}
          disabled={!confirmed || deleting}
          className="w-full py-3 rounded-lg items-center justify-center flex-row gap-2 mb-2"
          style={{ backgroundColor: STATUS_COLOR.red, opacity: confirmed && !deleting ? 1 : 0.4 }}
        >
          {deleting && <ActivityIndicator size="small" color="white" />}
          <Text className="text-[13.5px] font-semibold text-white">{deleting ? "Deleting..." : "Permanently delete my account"}</Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          disabled={deleting}
          className="w-full py-3 rounded-lg items-center mb-6"
          style={{ borderWidth: 1, borderColor: "#E0E8D3", backgroundColor: "white", opacity: deleting ? 0.4 : 1 }}
        >
          <Text className="text-[13.5px] font-semibold" style={{ color: PRIMARY }}>Keep my account</Text>
        </Pressable>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
