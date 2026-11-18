import { createContext, useContext, useEffect, useState } from "react";
import * as Linking from "expo-linking";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

// Confirmation/reset emails link back into the app itself (via the
// "myhomeos://" scheme configured in app.json and allow-listed in Supabase's
// Auth settings) instead of the old, unmaintained web app — but React Native
// has no browser to auto-detect the tokens Supabase appends to that URL, so
// they have to be parsed and applied by hand. Returns the parsed `type`
// ("signup", "recovery", ...) so the caller can react to it.
async function createSessionFromUrl(url) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) return null;
  const { access_token, refresh_token, type } = params;
  if (!access_token || !refresh_token) return null;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return null;
  return type || null;
}

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });

    // Handles a confirmation/reset link tapped while the app was already
    // running (addEventListener) and one that launched the app fresh from a
    // cold start (getInitialURL) — setSession() above fires onAuthStateChange
    // for the session itself, but not the "PASSWORD_RECOVERY" event (that's
    // only emitted by supabase-js's own URL auto-detection, which this
    // bypasses), so a recovery link's `type` is checked manually here.
    function handleUrl(url) {
      if (!url) return;
      createSessionFromUrl(url).then((type) => {
        if (type === "recovery") setPasswordRecovery(true);
      });
    }
    Linking.getInitialURL().then(handleUrl);
    const urlSubscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));

    return () => {
      listener.subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, []);

  function signOut() {
    supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, isLoading: session === undefined, passwordRecovery, clearPasswordRecovery: () => setPasswordRecovery(false), signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
