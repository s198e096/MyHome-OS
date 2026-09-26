import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import CostsScreen from "../../../screens/CostsScreen.js";

export default function Costs() {
  const router = useRouter();
  const { expenses, forecast, systemById } = useAppData();

  return (
    <CostsScreen
      expenses={expenses}
      forecast={forecast}
      systemById={systemById}
      onEdit={(e) => router.push(`/costs/${e.id}/edit`)}
      onAdd={() => router.push("/costs/new")}
    />
  );
}
