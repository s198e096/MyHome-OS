import { useRouter } from "expo-router";
import { useAppData } from "../../lib/app-data-context.js";
import HomeScreen from "../../screens/HomeScreen.js";

export default function Home() {
  const router = useRouter();
  const data = useAppData();

  return (
    <HomeScreen
      upcomingTasks={data.upcomingTasks}
      systemById={data.systemById}
      systems={data.systems}
      tasks={data.tasks}
      spentThisYear={data.spentThisYear}
      next12mo={data.next12mo}
      monthlyReserve={data.monthlyReserve}
      profile={data.profile}
      energyChecks={data.energyChecks}
      onOpenSystem={(s) => router.push(`/systems/${s.id}`)}
      onOpenAccount={() => router.push("/account")}
      onOpenEnergyAudit={() => router.push("/energy-audit")}
      onNavigate={(path) => router.push(path)}
    />
  );
}
