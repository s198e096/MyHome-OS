import { useState, createElement } from "react";
import { KeyboardAvoidingView, Platform, View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { PRIMARY, CATEGORY_META, systemShortName, systemIcon } from "../lib/constants.js";

const fieldStyle = { borderWidth: 1, borderColor: "#E0E8D3" };

// Two steps: pick which system, then describe what's wrong. Submitting
// hands both off to the caller, which logs the problem against that system
// and opens the AI chat already primed with it.
export default function ReportProblemScreen({ systems, onBack, onSubmit }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(selected, description.trim());
    } finally {
      setSubmitting(false);
    }
  }

  if (!selected) {
    return (
      <ScrollView className="flex-1 bg-[#F5F8F0] px-4" style={{ paddingTop: insets.top + 20 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={onBack} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Home</Text>
        </Pressable>
        <Text className="text-[17px] font-semibold text-stone-900 mb-1">Report a problem</Text>
        <Text className="text-[12.5px] text-stone-500 mb-4">Which system is it?</Text>

        <View className="rounded-xl bg-white px-3 mb-6" style={fieldStyle}>
          {systems.length === 0 && <Text className="py-3 text-[13px] text-stone-400">No systems added yet.</Text>}
          {systems.map((s, i) => {
            const meta = CATEGORY_META[s.category];
            const Icon = systemIcon(s);
            return (
              <Pressable
                key={s.id}
                onPress={() => setSelected(s)}
                className="flex-row items-center justify-between py-3"
                style={{ borderBottomWidth: i < systems.length - 1 ? 1 : 0, borderBottomColor: "#E7EEDB" }}
              >
                <View className="flex-row items-center gap-3 flex-1 min-w-0">
                  <View className="rounded-lg p-2 bg-[#F5F8F0]">
                    <Icon size={17} color="#5F5B50" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-[13.5px] text-stone-800" numberOfLines={1}>{systemShortName(s)}</Text>
                    <Text className="text-[11.5px] text-stone-400" numberOfLines={1}>{meta.label}{s.location ? ` · ${s.location}` : ""}</Text>
                  </View>
                </View>
                <ChevronRight size={15} color="#B8B4A8" />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  const Icon = systemIcon(selected);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-[#F5F8F0] px-4"
        style={{ paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => setSelected(null)} className="flex-row items-center gap-1 mb-3">
          <ChevronLeft size={16} color="#78716c" />
          <Text className="text-[13px] text-stone-500">Change system</Text>
        </Pressable>
        <Text className="text-[17px] font-semibold text-stone-900 mb-4">Report a problem</Text>

        <View className="flex-row items-center gap-3 rounded-xl bg-white p-3 mb-4" style={fieldStyle}>
          <View className="rounded-lg p-2 bg-[#F5F8F0]">
            {createElement(Icon, { size: 17, color: "#5F5B50" })}
          </View>
          <Text className="text-[13.5px] font-semibold text-stone-800 flex-1 min-w-0" numberOfLines={1}>
            {systemShortName(selected)}
          </Text>
        </View>

        <Text className="text-[11px] text-stone-500 mb-1">What&apos;s wrong?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the problem..."
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          className="w-full mb-4 px-3 py-2.5 rounded-lg text-[13.5px]"
          style={[fieldStyle, { minHeight: 110 }]}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!description.trim() || submitting}
          className="w-full py-3 rounded-lg items-center"
          style={{ backgroundColor: PRIMARY, opacity: !description.trim() || submitting ? 0.5 : 1 }}
        >
          <Text className="text-white text-[13.5px] font-semibold">{submitting ? "Submitting..." : "Submit and chat with AI"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
