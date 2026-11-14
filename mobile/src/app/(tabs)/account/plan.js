import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAppData } from "../../../lib/app-data-context.js";
import PlanScreen from "../../../screens/PlanScreen.js";

export default function Plan() {
  const router = useRouter();
  const { profile, selectPlan, manageBilling, refreshPlan } = useAppData();

  return (
    <PlanScreen
      currentPlan={profile.plan}
      onBack={() => router.back()}
      onSelectPlan={async (planId) => {
        const url = await selectPlan(planId);
        if (url) await WebBrowser.openBrowserAsync(url);
        // Back from Stripe: pick up the new plan (the webhook sets it).
        await refreshPlan().catch(() => {});
      }}
      onManageBilling={async () => {
        const url = await manageBilling();
        if (url) await WebBrowser.openBrowserAsync(url);
        await refreshPlan().catch(() => {});
      }}
    />
  );
}
