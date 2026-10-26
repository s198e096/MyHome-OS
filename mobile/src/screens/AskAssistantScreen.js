import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Send, Sparkles } from "lucide-react-native";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR } from "../lib/constants.js";
import { askAssistant } from "../lib/db.js";

const EXAMPLE_QUESTIONS = [
  "When should I replace my HVAC filter?",
  "What's my home's estimated value?",
  "What maintenance is coming up?",
];

// What to tell the user when the assistant can't answer. While developing
// (Expo Go), the server's own message is shown underneath so the real cause is
// visible; a shipped app only shows the friendly line.
function chatErrorText(err) {
  const base =
    err?.status === 401 ? "Your session expired. Sign out and back in, then try again."
    : err?.status === 429 ? "Too many questions at once. Give it a minute and try again."
    : err?.network ? "Couldn't reach the assistant. Check your connection and try again."
    : "Couldn't get a response. Try again.";
  return __DEV__ && (err?.detail || err?.status)
    ? `${base}\n[${err.status ?? "no status"}] ${String(err.detail || "").slice(0, 300)}`
    : base;
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className="rounded-2xl px-3.5 py-2.5"
        style={{ maxWidth: "85%", backgroundColor: isUser ? PRIMARY : "white", borderWidth: isUser ? 0 : 1, borderColor: "#E0E8D3" }}
      >
        <Text className="text-[13.5px]" style={{ color: isUser ? "white" : "#292524", lineHeight: 19 }}>
          {content}
        </Text>
      </View>
    </View>
  );
}

export default function AskAssistantScreen({ onBack, initialInput }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(initialInput || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  async function send(text) {
    const question = text.trim();
    if (!question || sending) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setSending(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    try {
      const reply = await askAssistant(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(chatErrorText(err));
    } finally {
      setSending(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <View className="flex-1 bg-[#F5F8F0]" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Pressable onPress={onBack} className="flex-row items-center gap-1">
            <ChevronLeft size={16} color="#78716c" />
            <Text className="text-[13px] text-stone-500">Home</Text>
          </Pressable>
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={14} color={PRIMARY} />
            <Text className="text-[13px] font-semibold" style={{ color: PRIMARY }}>Ask Anything</Text>
          </View>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View className="mt-4">
              <Text className="text-[13px] text-stone-500 mb-3">
                Ask about your home&apos;s systems, upcoming maintenance, or anything else — I can see your logged data.
              </Text>
              {EXAMPLE_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => send(q)}
                  className="rounded-xl px-3.5 py-2.5 mb-2"
                  style={{ backgroundColor: ACCENT_YELLOW }}
                >
                  <Text className="text-[13px] font-medium" style={{ color: PRIMARY }}>{q}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}

          {sending && (
            <View className="items-start mb-3">
              <View className="rounded-2xl px-3.5 py-3" style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#E0E8D3" }}>
                <ActivityIndicator size="small" color={PRIMARY} />
              </View>
            </View>
          )}
        </ScrollView>

        {error && <Text className="text-[12px] px-4 mb-2" style={{ color: STATUS_COLOR.red }}>{error}</Text>}

        <View
          className="flex-row items-center gap-2 px-4"
          style={{ paddingTop: 8, paddingBottom: insets.bottom + 10, borderTopWidth: 1, borderTopColor: "#E0E8D3" }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            className="flex-1 px-3.5 py-2.5 rounded-full text-[13.5px]"
            style={{ borderWidth: 1, borderColor: "#E0E8D3", backgroundColor: "white" }}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            editable={!sending}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={sending || !input.trim()}
            className="rounded-full items-center justify-center"
            style={{ width: 40, height: 40, backgroundColor: PRIMARY, opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Send size={17} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
