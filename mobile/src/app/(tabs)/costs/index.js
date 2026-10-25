import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import CostsScreen from "../../../screens/CostsScreen.js";

export default function Costs() {
  const router = useRouter();
  const { expenses, systemById, spentThisYear, next12mo, monthlyReserve } = useAppData();

  return (
    <AnimatedTabScreen tabKey="costs">
      <CostsScreen
        expenses={expenses}
        systemById={systemById}
        spentThisYear={spentThisYear}
        next12mo={next12mo}
        monthlyReserve={monthlyReserve}
        onAdd={() => router.push("/costs/new")}
        onViewLog={(filter) =>
          router.push(filter ? { pathname: "/costs/log", params: { systemId: filter.systemId, year: filter.year } } : "/costs/log")
        }
      />
    </AnimatedTabScreen>
  );
}
