import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewDocument() {
  const router = useRouter();
  const { systems, addDocument } = useAppData();

  return (
    <ItemFormScreen
      kind="doc"
      item={null}
      systems={systems}
      onBack={() => router.back()}
      onAddDocument={addDocument}
    />
  );
}
