import { useRouter } from "expo-router";
import { useAppData } from "../../lib/app-data-context.js";
import EnergyAuditScreen from "../../screens/EnergyAuditScreen.js";

export default function EnergyAudit() {
  const router = useRouter();
  const data = useAppData();

  return (
    <EnergyAuditScreen
      systems={data.systems}
      energyChecks={data.energyChecks}
      tasks={data.tasks}
      onBack={() => router.back()}
      onUpdateCheck={data.updateEnergyCheck}
      onCreateTask={data.createQuickTask}
    />
  );
}
