import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditDocument() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systems, documents, updateDocument, deleteDocument } = useAppData();
  const doc = documents.find((d) => d.id === id);

  if (!doc) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Document not found.</Text>
      </View>
    );
  }

  return (
    <ItemFormScreen
      kind="doc"
      item={doc}
      systems={systems}
      onBack={() => router.back()}
      onUpdateDocument={updateDocument}
      onDeleteDocument={async (delId) => {
        await deleteDocument(delId);
        router.back();
      }}
    />
  );
}
