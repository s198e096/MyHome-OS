import { useRouter } from "expo-router";
import AnimatedTabScreen from "../../components/AnimatedTabScreen.js";
import AskAssistantScreen from "../../screens/AskAssistantScreen.js";

export default function Ask() {
  const router = useRouter();

  return (
    <AnimatedTabScreen tabKey="ask">
      <AskAssistantScreen onBack={() => router.back()} />
    </AnimatedTabScreen>
  );
}
