import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import IncompleteSystemsScreen from "../../../screens/IncompleteSystemsScreen.js";

export default function IncompleteSystems() {
  const router = useRouter();
  const { systems } = useAppData();

  return (
    <IncompleteSystemsScreen
      systems={systems}
      onSelect={(s) => router.push(`/systems/${s.id}/edit`)}
      onBack={() => router.back()}
    />
  );
}
