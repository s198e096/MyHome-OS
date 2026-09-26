import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditSystem() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systems, systemById, updateSystem, deleteSystem, attachManualDocument } = useAppData();
  const sys = systemById(id);

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
      onDeleteSystem={async (delId) => {
        await deleteSystem(delId);
        router.back();
      }}
      onAttachManual={attachManualDocument}
    />
  );
}
