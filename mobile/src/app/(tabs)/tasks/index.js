import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import { useTutorial } from "../../../lib/tutorial-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import TasksScreen from "../../../screens/TasksScreen.js";

export default function Tasks() {
  const router = useRouter();
  const { upcomingTasks, tasks, systemById, undoTaskCompletion } = useAppData();
  const tutorial = useTutorial();

  return (
    <AnimatedTabScreen tabKey="tasks">
      <TasksScreen
        tasks={upcomingTasks}
        completed={tasks.filter((t) => t.completed)}
        systemById={systemById}
        onRemoveCompleted={(t) => undoTaskCompletion(t.id)}
        onComplete={(t) => router.push(`/tasks/${t.id}/complete`)}
        onEdit={(t) => router.push(`/tasks/${t.id}/edit`)}
        onAddManual={() => router.push("/tasks/new")}
        onImportTasks={() => router.push("/tasks/import")}
        tutorial={tutorial?.step === 1 ? tutorial : null}
      />
    </AnimatedTabScreen>
  );
}
