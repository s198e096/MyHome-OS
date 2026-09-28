import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import DocsScreen from "../../../screens/DocsScreen.js";

export default function Docs() {
  const router = useRouter();
  const { documents, systemById } = useAppData();

  return (
    <AnimatedTabScreen tabKey="docs">
      <DocsScreen
        documents={documents}
        systemById={systemById}
        onEdit={(d) => router.push(`/docs/${d.id}/edit`)}
        onAdd={() => router.push("/docs/new")}
      />
    </AnimatedTabScreen>
  );
}
