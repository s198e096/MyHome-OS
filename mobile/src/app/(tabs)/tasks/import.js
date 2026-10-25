import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ImportTasksScreen from "../../../screens/ImportTasksScreen.js";

export default function ImportTasks() {
  const router = useRouter();
  const { systems, tasks, addTask } = useAppData();

  async function handleImport(systemId, defs, startDate) {
    for (const def of defs) {
      await addTask(def.title, startDate, systemId, def.recurrence);
    }
  }

  return (
    <ImportTasksScreen
      systems={systems.filter((s) => !s.archived)}
      tasks={tasks}
      onBack={() => router.back()}
      onImport={handleImport}
    />
  );
}
