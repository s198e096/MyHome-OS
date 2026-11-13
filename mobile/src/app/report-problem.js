import { useRouter } from "expo-router";
import { useAppData } from "../lib/app-data-context.js";
import { systemName } from "../lib/constants.js";
import ReportProblemScreen from "../screens/ReportProblemScreen.js";

// Reached from Home's "Report a problem in a system" action. Logs the
// problem against that system, then hands off to the AI chat, already
// sent as the first message of a fresh conversation.
export default function ReportProblem() {
  const router = useRouter();
  const { systems, profile, addSystemProblem } = useAppData();

  async function handleSubmit(sys, description) {
    await addSystemProblem(sys.id, description);
    router.replace({
      pathname: "/ask",
      params: {
        name: profile?.name || "",
        prefill: `I'm having a problem with my ${systemName(sys)}: ${description}`,
        autoSend: "1",
        startNew: "1",
      },
    });
  }

  return (
    <ReportProblemScreen
      systems={systems.filter((s) => !s.archived)}
      onBack={() => router.back()}
      onSubmit={handleSubmit}
    />
  );
}
