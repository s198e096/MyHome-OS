import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, TextInput, Pressable, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Send, Sparkles, Menu, SquarePen, Trash2, X } from "lucide-react-native";
import { PRIMARY, ACCENT_YELLOW, STATUS_COLOR } from "../lib/constants.js";
import { askAssistant } from "../lib/db.js";
import { useChat } from "../lib/chat-context.js";
import ChatMessageText from "../components/ChatMessageText.js";

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

// "Hi Rami, what would you like to do?" - first name only, capitalized. The
// chat sits outside the tabs (where the profile lives), so Home passes the name in.
function greetingFor(name) {
  const raw = String(Array.isArray(name) ? name[0] : name || "").trim().split(/\s+/)[0];
  const first = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
  return `Hi ${first || "there"}, what would you like to do?`;
}

function Bubble({ role, content }) {
  const isUser = role === "user";
  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className="rounded-2xl px-3.5 py-2.5"
        style={{ maxWidth: "85%", backgroundColor: isUser ? PRIMARY : "white", borderWidth: isUser ? 0 : 1, borderColor: "#E0E8D3" }}
      >
        {isUser ? (
          <Text className="text-[13.5px]" style={{ color: "white", lineHeight: 19 }}>
            {content}
          </Text>
        ) : (
          <ChatMessageText text={content} />
        )}
      </View>
    </View>
  );
}

// Slide-over list of saved conversations (ChatGPT-style) — a "New chat"
// button up top, each row tappable to switch, with its own delete button
// since there's no other way to clean these up.
function ConversationDrawer({ visible, conversations, activeId, onSelect, onNew, onDelete, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View className="bg-[#F5F8F0]" style={{ width: "80%", maxWidth: 320, paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className="text-[15px] font-semibold text-stone-900">Conversations</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={18} color="#78716c" />
            </Pressable>
          </View>
          <Pressable
            onPress={onNew}
            className="flex-row items-center gap-2 mx-4 mb-3 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: PRIMARY }}
          >
            <SquarePen size={15} color="white" />
            <Text className="text-[13px] font-semibold text-white">New chat</Text>
          </Pressable>
          <ScrollView className="flex-1 px-2" showsVerticalScrollIndicator={false}>
            {conversations.length === 0 && <Text className="px-2 py-3 text-[12.5px] text-stone-400">No saved conversations yet.</Text>}
            {conversations.map((c) => {
              const selected = c.id === activeId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => onSelect(c.id)}
                  className="flex-row items-center justify-between gap-2 px-3 py-2.5 rounded-lg mb-1"
                  style={{ backgroundColor: selected ? "#E7EEDB" : "transparent" }}
                >
                  <Text
                    className="text-[13px] flex-1 min-w-0"
                    numberOfLines={1}
                    style={{ color: selected ? PRIMARY : "#44403c", fontWeight: selected ? "600" : "400" }}
                  >
                    {c.title}
                  </Text>
                  <Pressable onPress={() => onDelete(c.id)} hitSlop={8}>
                    <Trash2 size={14} color="#B8B4A8" />
                  </Pressable>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(22,36,15,0.35)" }} />
      </View>
    </Modal>
  );
}

export default function AskAssistantScreen({ onBack, initialInput, name }) {
  const insets = useSafeAreaInsets();
  const { messages, setMessages, conversations, activeId, startNewConversation, switchConversation, deleteConversation } = useChat();
  const [input, setInput] = useState(initialInput || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef(null);

  // Jump straight to the latest message when reopening a conversation that
  // already has history, instead of landing scrolled to the top.
  useEffect(() => {
    if (messages.length > 0) requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: later message-count changes are handled by the scrolls in send()
  }, []);

  function handleSelectConversation(id) {
    switchConversation(id);
    setInput("");
    setError("");
    setDrawerOpen(false);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }

  function handleNewConversation() {
    startNewConversation();
    setInput("");
    setError("");
    setDrawerOpen(false);
  }

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
          <View className="flex-row items-center gap-3" style={{ width: 60, justifyContent: "flex-end" }}>
            <Pressable onPress={handleNewConversation} hitSlop={8}>
              <SquarePen size={18} color="#78716c" />
            </Pressable>
            <Pressable onPress={() => setDrawerOpen(true)} hitSlop={8}>
              <Menu size={18} color="#78716c" />
            </Pressable>
          </View>
        </View>

        <ConversationDrawer
          visible={drawerOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={deleteConversation}
          onClose={() => setDrawerOpen(false)}
        />

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Bubble role="assistant" content={greetingFor(name)} />

          {messages.length === 0 && (
            <View className="mt-1">
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
