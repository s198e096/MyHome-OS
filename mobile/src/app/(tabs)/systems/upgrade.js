import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import UpgradeSystemScreen from "../../../screens/UpgradeSystemScreen.js";

export default function UpgradeSystem() {
  const router = useRouter();
  const { systems, addSystemAtLimit } = useAppData();

  return (
    <UpgradeSystemScreen
      systems={systems}
      onBack={() => router.back()}
      // Replacing one system with another is a net-zero swap, so it's
      // exempt from the free-plan limit — only a genuinely new one counts.
      onPickNew={() => router.push(addSystemAtLimit() ? "/account/plan" : "/systems/new")}
      onPickReplacement={(sys) => router.push({ pathname: "/systems/new", params: { replaces: sys.id } })}
    />
  );
}
