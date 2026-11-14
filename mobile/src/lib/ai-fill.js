import { useAppData } from "./app-data-context.js";
import { FREE_AI_FILL_LIMIT } from "./constants.js";

// The Free plan's AI auto-fill allowance, for every place that offers it (the
// Add/Edit System form and the onboarding walkthrough). The server is what
// actually enforces it - this just lets a screen show "N left" and stop
// offering a scan that would be turned away.
//   left      - scans remaining, or null on a paid plan (unlimited)
//   exhausted - Free plan with none left
//   refresh() - re-read the usage after a scan (success or failure)
export function useAiFill() {
  const { isFreePlan, aiUsage, refreshAiUsage } = useAppData();
  const left = isFreePlan ? Math.max(0, FREE_AI_FILL_LIMIT - aiUsage.fillUsed) : null;
  return {
    isFreePlan,
    left,
    exhausted: left === 0,
    refresh: () => {
      if (isFreePlan) refreshAiUsage().catch(() => {});
    },
  };
}

export const FILL_LIMIT_MESSAGE = `You've used all ${FREE_AI_FILL_LIMIT} free AI auto-fills. You can fill in the details yourself, or upgrade for unlimited auto-fill.`;
