import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditTask() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { systems, tasks, updateTask, deleteTask } = useAppData();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Task not found.</Text>
      </View>
    );
  }

  // After a delete, land on the Tasks list. A plain "back" does that when the
  // list is underneath this page, but a page opened straight from Home has
  // nothing under it in the Tasks tab, so "back" would drop to Home instead -
  // in that case swap this page for the list.
  function goToTaskList() {
    if (navigation.getState().routes.length > 1) router.back();
    else router.replace("/tasks");
  }

  return (
    <ItemFormScreen
      kind="task"
      item={task}
      systems={systems}
      onBack={() => router.back()}
      onUpdateTask={updateTask}
      // Navigation after a delete is the form's onDeleted (below): this just
      // deletes, so there's exactly one move - not an extra "back" that would
      // skip past the Tasks list.
      onDeleteTask={deleteTask}
      onDeleted={goToTaskList}
    />
  );
}
