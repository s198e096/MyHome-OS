import { useLocalSearchParams, useRouter } from "expo-router";
import AskAssistantScreen from "../screens/AskAssistantScreen.js";

// The chat is a full-screen page opened on top of the tabs, not a tab itself.
// (It used to be a hidden tab, which the tab bar can't actually navigate to
// from another tab: the address changed to /ask and then snapped back to Home
// before the screen ever rendered.)
export default function Ask() {
  const router = useRouter();
  const { prefill } = useLocalSearchParams();

  return <AskAssistantScreen onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))} initialInput={prefill} />;
}
