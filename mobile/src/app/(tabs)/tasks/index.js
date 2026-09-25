import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import TasksScreen from "../../../screens/TasksScreen.js";

export default function Tasks() {
  const router = useRouter();
  const { upcomingTasks, tasks, systemById, toggleTask } = useAppData();

  return (
    <TasksScreen
      tasks={upcomingTasks}
      completed={tasks.filter((t) => t.completed)}
      systemById={systemById}
      onToggle={toggleTask}
      onEdit={(t) => router.push(`/tasks/${t.id}/edit`)}
      onAdd={() => router.push("/tasks/new")}
    />
  );
}
