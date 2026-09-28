import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import { useSession } from "../../../lib/auth-context.js";
import AnimatedTabScreen from "../../../components/AnimatedTabScreen.js";
import AccountScreen from "../../../screens/AccountScreen.js";

export default function Account() {
  const router = useRouter();
  const { profile } = useAppData();
  const { signOut } = useSession();

  return (
    <AnimatedTabScreen tabKey="account">
      <AccountScreen
        profile={profile}
        onEdit={() => router.push("/account/edit")}
        onManagePlan={() => router.push("/account/plan")}
        onSignOut={signOut}
      />
    </AnimatedTabScreen>
  );
}
