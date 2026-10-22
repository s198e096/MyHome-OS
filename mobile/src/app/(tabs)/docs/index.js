import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import DocsScreen from "../../../screens/DocsScreen.js";

export default function Docs() {
  const router = useRouter();
  const { documents, systems } = useAppData();

  return (
    <AnimatedTabScreen tabKey="docs">
      <DocsScreen
        documents={documents}
        systems={systems}
        onSelectSystem={(sys) => router.push(`/docs/system/${sys.id}`)}
        onSelectGeneral={() => router.push("/docs/general")}
        onAdd={() => router.push("/docs/new")}
      />
    </AnimatedTabScreen>
  );
}
