import "../../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../lib/auth-context.js";
import { ChatProvider } from "../lib/chat-context.js";
import KeyboardDoneBar from "../components/KeyboardDoneBar.js";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ChatProvider>
          <RootNavigator />
        </ChatProvider>
      </SessionProvider>
      <KeyboardDoneBar />
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, isLoading, passwordRecovery } = useSession();

  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* redirectTo is explicit rather than relying on the default
          anchor-route fallback: signing out from a screen nested several
          navigators deep (tabs > its own stack > a screen) was landing on
          the "Unmatched route" page instead of sign-in. */}
      <Stack.Protected guard={!!session && !passwordRecovery} redirectTo="/sign-in">
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
