import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewExpense() {
  const router = useRouter();
  const { systems, addExpense } = useAppData();

  return (
    <ItemFormScreen
      kind="expense"
      item={null}
      systems={systems}
      onBack={() => router.back()}
      onAddExpense={addExpense}
    />
  );
}
