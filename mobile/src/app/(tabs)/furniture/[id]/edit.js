import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import ItemFormScreen from "../../../../screens/ItemFormScreen.js";

export default function EditFurniture() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { furniture, updateFurniture, deleteFurniture } = useAppData();
  const item = furniture.find((f) => f.id === id);

  if (!item) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">Item not found.</Text>
      </View>
    );
  }

  return (
    <ItemFormScreen
      kind="furniture"
      item={item}
      systems={[]}
      onBack={() => router.back()}
      onUpdateFurniture={updateFurniture}
      onDeleteFurniture={async (delId) => {
        await deleteFurniture(delId);
        router.back();
      }}
    />
  );
}
