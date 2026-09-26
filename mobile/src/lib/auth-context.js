import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

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
    return () => listener.subscription.unsubscribe();
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
