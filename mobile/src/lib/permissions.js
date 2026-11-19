import * as TrackingTransparency from "expo-tracking-transparency";
import { requestNotificationPermission } from "./notifications.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The standard first-launch permission prompts, shown once right after
// onboarding finishes (property + systems added): App Tracking Transparency
// first, then notifications — the order most apps use, and the only order
// iOS allows since it won't show a second system prompt until the first is
// dismissed. Each is best-effort; a denial or platform where one doesn't
// apply (ATT on Android always resolves "granted" with no prompt) just means
// the next one still runs.
export async function requestOnboardingPermissions() {
  try {
    await TrackingTransparency.requestTrackingPermissionsAsync();
  } catch {
    // Ignore — tracking permission is non-essential to the app working.
  }
  // iOS needs a beat to finish dismissing the ATT alert and return the app
  // to active before it will reliably present a second native permission
  // dialog — firing requestNotificationPermission immediately after ATT
  // resolves can otherwise have iOS silently skip showing it.
  await wait(750);
  try {
    await requestNotificationPermission();
  } catch {
    // Ignore — notification permission is non-essential to the app working.
  }
}
