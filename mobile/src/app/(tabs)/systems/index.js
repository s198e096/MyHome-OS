import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import SystemsScreen from "../../../screens/SystemsScreen.js";

export default function Systems() {
  const router = useRouter();
  const { systems, tasks, addSystemAtLimit } = useAppData();

  return (
    <SystemsScreen
      systems={systems}
      tasks={tasks}
      onSelect={(s) => router.push(`/systems/${s.id}`)}
      onAdd={() => router.push(addSystemAtLimit() ? "/account/plan" : "/systems/new")}
      atLimit={addSystemAtLimit()}
    />
  );
}
