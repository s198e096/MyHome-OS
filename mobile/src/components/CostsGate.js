import { useRouter } from "expo-router";
import { useAppData } from "../lib/app-data-context.js";
import { useTutorial } from "../lib/tutorial-context.js";
import AnimatedTabScreen from "./AnimatedTabScreen.js";
import LockedCostsScreen from "../screens/LockedCostsScreen.js";

// Costs is a paid-plan feature. Every page under /costs (the overview, the
// expense log and the add/edit forms) is wrapped in this, so on the Free plan
// each of them - including a deep link straight to one - shows the locked
// screen instead of its content.
export default function CostsGate({ children }) {
  const router = useRouter();
  const { isFreePlan } = useAppData();
  const tutorial = useTutorial();

  if (!isFreePlan) return children;

  return (
    <AnimatedTabScreen tabKey="costs">
      <LockedCostsScreen onSeePlans={() => router.push("/account/plan")} tutorial={tutorial?.step === 2 ? tutorial : null} />
    </AnimatedTabScreen>
  );
}
