import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import TasksScreen from "../../../screens/TasksScreen.js";

export default function Tasks() {
  const router = useRouter();
  const { upcomingTasks, tasks, systemById, deleteTask } = useAppData();

  return (
    <AnimatedTabScreen tabKey="tasks">
      <TasksScreen
        tasks={upcomingTasks}
        completed={tasks.filter((t) => t.completed)}
        systemById={systemById}
        onRemoveCompleted={(t) => deleteTask(t.id)}
        onComplete={(t) => router.push(`/tasks/${t.id}/complete`)}
        onEdit={(t) => router.push(`/tasks/${t.id}/edit`)}
        onAddManual={() => router.push("/tasks/new")}
        onImportTasks={() => router.push("/tasks/import")}
      />
    </AnimatedTabScreen>
  );
}
