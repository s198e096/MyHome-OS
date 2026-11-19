import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditTask() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systems, tasks, updateTask, deleteTask } = useAppData();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Task not found.</Text>
      </View>
    );
  }

  return (
    <ItemFormScreen
      kind="task"
      item={task}
      systems={systems}
      onBack={() => router.back()}
      onUpdateTask={updateTask}
      // The form already steps back as soon as Delete is confirmed, so this
      // must not navigate as well - a second back would skip past the Tasks
      // list and land on Home.
      onDeleteTask={deleteTask}
    />
  );
}
