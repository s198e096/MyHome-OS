import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAppData } from "../../../lib/app-data-context.js";
import { useSession } from "../../../lib/auth-context.js";
import { clearStoredChats } from "../../../lib/chat-context.js";
import { deleteAccount } from "../../../lib/db.js";
import DeleteAccountScreen from "../../../screens/DeleteAccountScreen.js";

export default function DeleteAccount() {
  const router = useRouter();
  const { session } = useSession();
  const { profile, systems, tasks, expenses, documents } = useAppData();

  async function handleDelete() {
    const userId = session.user.id;
    // Throws if anything went wrong (nothing is deleted in that case) and the
    // screen shows why. On success the session is dropped, which sends the
    // user back to sign-in.
    await deleteAccount();
    await clearStoredChats(userId);
    Alert.alert("Account deleted", "Your account and everything in it has been permanently deleted.");
  }

  return (
    <DeleteAccountScreen
      email={profile.email}
      plan={profile.plan}
      counts={{ systems: systems.length, tasks: tasks.length, expenses: expenses.length, documents: documents.length }}
      onBack={() => router.back()}
      onDelete={handleDelete}
    />
  );
}
