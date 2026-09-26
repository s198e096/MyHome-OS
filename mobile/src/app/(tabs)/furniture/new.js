import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import ItemFormScreen from "../../../screens/ItemFormScreen.js";

export default function NewFurniture() {
  const router = useRouter();
  const { addFurniture } = useAppData();

  return (
    <ItemFormScreen
      kind="furniture"
      item={null}
      systems={[]}
      onBack={() => router.back()}
      onAddFurniture={addFurniture}
    />
  );
}
