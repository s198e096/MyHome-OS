import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import { systemShortName } from "../../../../lib/constants.js";
import SystemDocsScreen from "../../../../screens/SystemDocsScreen.js";

export default function DocsBySystem() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { documents, systemById } = useAppData();
  const sys = systemById(id);

  if (!sys) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">System not found.</Text>
      </View>
    );
  }

  return (
    <SystemDocsScreen
      title={systemShortName(sys)}
      documents={documents.filter((d) => d.systemId === sys.id)}
      onBack={() => router.back()}
      onEdit={(d) => router.push(`/docs/${d.id}/edit`)}
    />
  );
}
