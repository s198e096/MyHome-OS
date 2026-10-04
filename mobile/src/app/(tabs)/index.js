import { useRouter } from "expo-router";
import { useAppData } from "../../lib/app-data-context.js";
import AnimatedTabScreen from "../../components/AnimatedTabScreen.js";
import HomeScreen from "../../screens/HomeScreen.js";

export default function Home() {
  const router = useRouter();
  const data = useAppData();

  return (
    <AnimatedTabScreen tabKey="home">
    <HomeScreen
      upcomingTasks={data.upcomingTasks}
      systemById={data.systemById}
      systems={data.systems}
      tasks={data.tasks}
      spentThisYear={data.spentThisYear}
      next12mo={data.next12mo}
      monthlyReserve={data.monthlyReserve}
      profile={data.profile}
      onOpenSystem={(s) => router.push(`/systems/${s.id}`)}
      onOpenAccount={() => router.push("/account")}
      onOpenAssistant={() => router.push("/ask")}
      onNavigate={(path) => router.push(path)}
    />
    </AnimatedTabScreen>
  );
}
