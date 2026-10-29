import "../../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../lib/auth-context.js";
import { ChatProvider } from "../lib/chat-context.js";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ChatProvider>
          <RootNavigator />
        </ChatProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, isLoading, passwordRecovery } = useSession();

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && !passwordRecovery}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ask" />
      </Stack.Protected>
      <Stack.Protected guard={passwordRecovery}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={!session && !passwordRecovery}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
