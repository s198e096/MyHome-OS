import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import CompleteTaskScreen from "../../../../screens/CompleteTaskScreen.js";

export default function CompleteTask() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { tasks, systemById, completeTaskWithCost } = useAppData();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Task not found.</Text>
      </View>
    );
  }

  // A plain "back" lands on the Tasks list when it's underneath this page,
  // but this page is also opened straight from Home's overdue/upcoming
  // list, which has nothing under it in the Tasks tab - there, "back" drops
  // to Home instead and leaves this screen as the Tasks tab's last-shown
  // page, stuck there (and resubmittable) until it's explicitly swapped out.
  function goToTaskList() {
    if (navigation.getState().routes.length > 1) router.back();
    else router.replace("/tasks");
  }

  return (
    <CompleteTaskScreen
      task={task}
      sys={task.systemId ? systemById(task.systemId) : null}
      onBack={goToTaskList}
      onComplete={async (cost, completedDate) => {
        await completeTaskWithCost(task.id, cost, completedDate);
        goToTaskList();
      }}
    />
  );
}
