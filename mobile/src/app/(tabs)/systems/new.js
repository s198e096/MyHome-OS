import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewSystem() {
  const router = useRouter();
  const { systems, addSystem, attachManualDocument } = useAppData();

  return (
    <ItemFormScreen
      kind="system"
      item={null}
      systems={systems}
      onBack={() => router.back()}
      onAddSystem={addSystem}
      onAttachManual={attachManualDocument}
    />
  );
}
