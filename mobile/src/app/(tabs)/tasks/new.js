import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewTask() {
  const router = useRouter();
  const { systems, addTask } = useAppData();

  return (
    <ItemFormScreen
      kind="task"
      item={null}
      systems={systems}
      onBack={() => router.back()}
      onAddTask={addTask}
    />
  );
}
