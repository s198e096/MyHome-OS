import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import FurnitureScreen from "../../../screens/FurnitureScreen.js";

export default function Furniture() {
  const router = useRouter();
  const { furniture } = useAppData();

  return (
    <AnimatedTabScreen tabKey="furniture">
      <FurnitureScreen
        furniture={furniture}
        onEdit={(f) => router.push(`/furniture/${f.id}/edit`)}
        onAdd={() => router.push("/furniture/new")}
      />
    </AnimatedTabScreen>
  );
}
