import { createContext, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "./auth-context.js";

const ChatContext = createContext(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside <ChatProvider>");
  return value;
}

const storageKey = (userId) => `chat_conversations_${userId}`;

// Short title from the first user message — same idea as ChatGPT's
// auto-titling, just without a second AI call to generate it.
function titleFrom(messages) {
  const text = (messages.find((m) => m.role === "user")?.content || "").replace(/\s+/g, " ").trim();
  return text.length > 40 ? `${text.slice(0, 40)}…` : text || "New chat";
}

// Multiple saved Ask Anything conversations (like ChatGPT), persisted on
// device so they survive leaving the screen, switching tabs, and closing
// the app. Switching conversations is instant (all held in memory once
// loaded); only the full set is written back to storage, on change.
export function ChatProvider({ children }) {
  const { session } = useSession();
  const userId = session?.user?.id;
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [lastUserId, setLastUserId] = useState(userId);
  // Mirrors activeId for use inside setMessages, which needs the current
  // value synchronously rather than whatever it closed over at render time.
  // The actions below keep this in sync directly (refs may be written from
  // event handlers, just not during render); this effect is the fallback
  // for the one path that changes activeId without going through them —
  // the reset block right below.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Resets to a blank, not-yet-loaded state whenever the signed-in user
  // changes, so one account never sees another's saved chats. Adjusted
  // during render (React's pattern for resetting state on a prop change)
  // rather than in an effect, so the stale list never gets a chance to paint.
  if (userId !== lastUserId) {
    setLastUserId(userId);
    setConversations([]);
    setActiveId(null);
    setLoaded(false);
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        if (!cancelled && raw) setConversations(JSON.parse(raw));
      } catch {
        // Corrupt or unreadable storage just starts fresh.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Not before the initial load finishes, or this would overwrite whatever
  // was already saved with the still-empty starting array.
  useEffect(() => {
    if (!userId || !loaded) return;
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(conversations)).catch(() => {});
  }, [userId, loaded, conversations]);

  const messages = conversations.find((c) => c.id === activeId)?.messages || [];

  // Same calling convention as plain useState's setter (value or updater
  // function) so the chat screen barely changes. Starts a new conversation
  // lazily on its first message, rather than the moment "New chat" is
  // tapped, so an empty draft never clutters the saved list.
  function setMessages(updater) {
    let targetId = activeIdRef.current;
    if (!targetId) {
      targetId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      activeIdRef.current = targetId;
      setActiveId(targetId);
    }
    setConversations((cs) => {
      const current = cs.find((c) => c.id === targetId);
      const prevMessages = current?.messages || [];
      const nextMessages = typeof updater === "function" ? updater(prevMessages) : updater;
      const updated = { id: targetId, title: titleFrom(nextMessages), messages: nextMessages, updatedAt: Date.now() };
      return current ? cs.map((c) => (c.id === targetId ? updated : c)) : [updated, ...cs];
    });
  }

  function startNewConversation() {
    activeIdRef.current = null;
    setActiveId(null);
  }

  function switchConversation(id) {
    activeIdRef.current = id;
    setActiveId(id);
  }

  function deleteConversation(id) {
    setConversations((cs) => cs.filter((c) => c.id !== id));
    if (activeIdRef.current === id) {
      activeIdRef.current = null;
      setActiveId(null);
    }
  }

  const sortedConversations = conversations.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <ChatContext.Provider
      value={{ messages, setMessages, conversations: sortedConversations, activeId, startNewConversation, switchConversation, deleteConversation }}
    >
      {children}
    </ChatContext.Provider>
  );
}
