import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import IntroScreen from "../../screens/IntroScreen.js";

const SEEN_INTRO_KEY = "has_seen_intro";

// The default screen of the signed-out (auth) group (an `index` file is
// Expo Router's documented way to set a group's default route, rather than
// relying on file order). Shows the intro only the very first time the app
// is opened — every later sign-out skips straight to sign-in.
export default function AuthIndex() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_INTRO_KEY)
      .then((seen) => {
        if (seen === "1") router.replace("/sign-in");
        else setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [router]);

  if (!checked) return null;

  return (
    <IntroScreen
      onDone={() => {
        AsyncStorage.setItem(SEEN_INTRO_KEY, "1").catch(() => {});
        router.replace("/sign-in");
      }}
    />
  );
}
