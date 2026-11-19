import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditSystem() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systems, systemById, updateSystem, deleteSystem, attachManualDocument, addDocument, documents, warranties, addWarranty, deleteWarranty } = useAppData();
  const found = systemById(id);

  // Once the system is removed from the list, this page would turn into
  // "System not found" - while its documents may still be being deleted. The
  // system being deleted is kept here so the page keeps showing it until the
  // delete has finished and the page navigates away.
  const [deletingSystem, setDeletingSystem] = useState(null);
  const sys = found || deletingSystem;

  if (!sys) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">System not found.</Text>
      </View>
    );
  }

  return (
    <ItemFormScreen
      kind="system"
      item={sys}
      systems={systems}
      onBack={() => router.back()}
      onUpdateSystem={updateSystem}
      onDeleteSystem={async (delId, options) => {
        setDeletingSystem(sys);
        let result;
        try {
          result = await deleteSystem(delId, options);
        } catch (err) {
          setDeletingSystem(null);
          throw err;
        }
        router.back();
        // The system itself is gone; any document that couldn't be removed is
        // still safe, filed under General in Docs.
        if (result?.failedDocuments > 0) {
          Alert.alert(
            "Some documents weren't deleted",
            `The system was deleted, but ${result.failedDocuments} of its documents couldn't be removed. They're still in Documents under General - you can delete them from there.`
          );
        }
      }}
      onAttachManual={attachManualDocument}
      onAddDocument={addDocument}
      linkedDocuments={documents.filter((d) => d.systemId === sys.id)}
      warranties={warranties.filter((w) => w.systemId === sys.id)}
      onAddWarranty={addWarranty}
      onDeleteWarranty={deleteWarranty}
    />
  );
}
