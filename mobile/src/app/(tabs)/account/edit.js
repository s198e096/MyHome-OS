import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import EditProfileScreen from "../../../screens/EditProfileScreen.js";

export default function EditProfile() {
  const router = useRouter();
  const { profile, saveProfile } = useAppData();

  return (
    <EditProfileScreen
      profile={profile}
      onBack={() => router.back()}
      onSave={async (next) => {
        await saveProfile(next);
        router.back();
      }}
    />
  );
}
