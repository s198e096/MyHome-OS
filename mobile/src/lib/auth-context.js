import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
    supabase.auth.getSession().then(async ({ data }) => {
      // getSession() only reads the token cached on-device — it doesn't
      // confirm the user it belongs to still exists server-side (the
      // account could've been deleted from the dashboard, or from another
      // device, while this one still has a cached session). getUser()
      // actually asks the server, so a since-deleted account's stale
      // session gets signed out locally here instead of the app getting
      // stuck loading data for a user that's gone — every query for it
      // would fail (e.g. a foreign-key violation on insert), and nothing
      // downstream treats that as "fall back to sign-in".
      if (data.session) {
        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut({ scope: "local" });
          return;
        }
      }
      setSession(data.session);
    });
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

  // Stable identity (useCallback) so app-data-context.js's data-loading
  // effect can depend on it without re-running every render.
  const signOut = useCallback(() => {
    // "local" only clears this device's session, rather than also asking
    // the server to revoke it — there's no "sign out everywhere" feature
    // here, and a server round-trip would be pointless (or fail outright)
    // for a session whose user no longer exists, the exact case this is
    // also called for above.
    return supabase.auth.signOut({ scope: "local" });
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, isLoading: session === undefined, passwordRecovery, clearPasswordRecovery: () => setPasswordRecovery(false), signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
