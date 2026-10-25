import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import { systemShortName } from "../../../lib/constants.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewSystem() {
  const router = useRouter();
  const { replaces } = useLocalSearchParams();
  const { systems, systemById, addSystem, archiveSystem, attachManualDocument, addDocument, addWarranty } = useAppData();
  const replacesSystem = replaces ? systemById(replaces) : null;

  async function handleAddSystem(payload) {
    const created = await addSystem(payload);
    if (replacesSystem) await archiveSystem(replacesSystem.id);
    return created;
  }

  return (
    <ItemFormScreen
      kind="system"
      item={null}
      systems={systems}
      replacesSystem={replacesSystem}
      hint={replacesSystem ? `Replacing ${systemShortName(replacesSystem)} — it'll be archived once you save.` : undefined}
      onBack={() => router.back()}
      onAddSystem={handleAddSystem}
      onAttachManual={attachManualDocument}
      onAddDocument={addDocument}
      warranties={[]}
      onAddWarranty={addWarranty}
    />
  );
}
