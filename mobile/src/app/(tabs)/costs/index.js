import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import { useTutorial } from "../../../lib/tutorial-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import CostsScreen from "../../../screens/CostsScreen.js";
import CostsGate from "../../../components/CostsGate.js";

export default function Costs() {
  const router = useRouter();
  const { expenses, systemById, spentThisYear, next12mo, next12moBreakdown, monthlyReserve, monthlyReserveBreakdown } = useAppData();
  const tutorial = useTutorial();

  return (
    <CostsGate>
      <AnimatedTabScreen tabKey="costs">
        <CostsScreen
          expenses={expenses}
          systemById={systemById}
          spentThisYear={spentThisYear}
          next12mo={next12mo}
          next12moBreakdown={next12moBreakdown}
          monthlyReserve={monthlyReserve}
          monthlyReserveBreakdown={monthlyReserveBreakdown}
          tutorial={tutorial?.step === 2 ? tutorial : null}
          onAdd={() => router.push("/costs/new")}
          onViewLog={(filter) =>
            router.push(
              filter
                ? {
                    pathname: "/costs/log",
                    // Omit keys the filter doesn't set (rather than pass them as
                    // `undefined`), so there's no stray "systemId=undefined" in
                    // the URL for a year-only filter — that would otherwise read
                    // back as a truthy string and filter everything out.
                    params: { ...(filter.systemId ? { systemId: filter.systemId } : {}), ...(filter.year ? { year: filter.year } : {}) },
                  }
                : "/costs/log"
            )
          }
        />
      </AnimatedTabScreen>
    </CostsGate>
  );
}
