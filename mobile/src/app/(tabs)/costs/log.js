import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ExpenseLogScreen from "../../../screens/ExpenseLogScreen.js";

export default function ExpenseLog() {
  const router = useRouter();
  const { expenses, systemById } = useAppData();

  return (
    <ExpenseLogScreen
      expenses={expenses}
      systemById={systemById}
      onBack={() => router.back()}
      onEdit={(e) => router.push(`/costs/${e.id}/edit`)}
    />
  );
}
