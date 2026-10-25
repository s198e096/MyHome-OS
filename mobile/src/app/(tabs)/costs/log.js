import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ExpenseLogScreen from "../../../screens/ExpenseLogScreen.js";

export default function ExpenseLog() {
  const router = useRouter();
  const { systemId, year } = useLocalSearchParams();
  const { expenses, systemById } = useAppData();

  return (
    <ExpenseLogScreen
      expenses={expenses}
      systemById={systemById}
      filterSystemId={systemId}
      filterYear={year ? Number(year) : null}
      onBack={() => router.back()}
      onEdit={(e) => router.push(`/costs/${e.id}/edit`)}
      onClearFilter={() => router.setParams({ systemId: "", year: "" })}
    />
  );
}
