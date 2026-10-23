import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import CompleteTaskScreen from "../../../../screens/CompleteTaskScreen.js";

export default function CompleteTask() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { tasks, systemById, completeTaskWithCost } = useAppData();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Task not found.</Text>
      </View>
    );
  }

  return (
    <CompleteTaskScreen
      task={task}
      sys={task.systemId ? systemById(task.systemId) : null}
      onBack={() => router.back()}
      onComplete={async (cost) => {
        await completeTaskWithCost(task.id, cost);
        router.back();
      }}
    />
  );
}
