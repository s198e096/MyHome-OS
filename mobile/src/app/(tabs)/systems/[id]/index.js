import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useAppData } from "../../../../lib/app-data-context.js";
import SystemDetail from "../../../../screens/SystemDetail.js";

export default function SystemDetailRoute() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { systemById, tasks, documents } = useAppData();
  const sys = systemById(id);

  if (!sys) {
    return (
      <View className="flex-1 bg-[#F5F8F0] items-center justify-center">
        <Text className="text-stone-400 text-[13px]">System not found.</Text>
      </View>
    );
  }

  return (
    <SystemDetail
      sys={sys}
      tasks={tasks.filter((t) => t.systemId === sys.id)}
      documents={documents.filter((d) => d.systemId === sys.id)}
      onBack={() => router.back()}
      onEdit={() => router.push(`/systems/${sys.id}/edit`)}
    />
  );
}
