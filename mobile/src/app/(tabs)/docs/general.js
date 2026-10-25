import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import SystemDocsScreen from "../../../screens/SystemDocsScreen.js";

export default function GeneralDocs() {
  const router = useRouter();
  const { documents, deleteDocument } = useAppData();

  return (
    <SystemDocsScreen
      title="General"
      documents={documents.filter((d) => !d.systemId)}
      onBack={() => router.back()}
      onEdit={(d) => router.push(`/docs/${d.id}/edit`)}
      onDelete={deleteDocument}
    />
  );
}
