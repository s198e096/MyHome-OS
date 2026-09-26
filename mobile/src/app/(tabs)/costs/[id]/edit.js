import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditExpense() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systems, expenses, updateExpense, deleteExpense } = useAppData();
  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Expense not found.</Text>
      </View>
    );
  }

  return (
    <ItemFormScreen
      kind="expense"
      item={expense}
      systems={systems}
      onBack={() => router.back()}
      onUpdateExpense={updateExpense}
      onDeleteExpense={async (delId) => {
        await deleteExpense(delId);
        router.back();
      }}
    />
  );
}
