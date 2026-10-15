import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Supabase Auth's clock can run ~1s ahead of PostgREST's, so a request sent
// right after a token refresh (e.g. at app launch) is rejected with PGRST303
// "JWT issued at future". The request never ran, so waiting and retrying is safe.
const SKEW_RETRY_DELAY_MS = 1500;
const SKEW_MAX_RETRIES = 2;

async function fetchWithSkewRetry(input, init) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(input, init);
    if (res.status !== 401 || attempt >= SKEW_MAX_RETRIES) return res;
    const body = await res.clone().json().catch(() => null);
    if (body?.code !== "PGRST303") return res;
    await new Promise((resolve) => setTimeout(resolve, SKEW_RETRY_DELAY_MS));
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchWithSkewRetry },
});
