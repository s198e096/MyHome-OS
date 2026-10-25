import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Local-only (no push server): a reminder notification per open task, fired
// on-device at 9am on its due date.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL_ID = "task-reminders";
const DUE_HOUR = 9;
const NOTIFICATION_TYPE = "task-due";

let setupDone = false;

async function ensureSetup() {
  if (setupDone) return;
  setupDone = true;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Task reminders",
      // eslint-disable-next-line import/namespace -- re-exported via `export *`, which this rule's resolver doesn't see
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.requestPermissionsAsync();
}

async function cancelOurs() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ours = scheduled.filter((n) => n.content.data?.type === NOTIFICATION_TYPE);
  await Promise.all(ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

// Keeps the device's scheduled "task due" notifications in sync with the
// current open-tasks list: cancels every one of ours, then reschedules
// fresh for each open task due today or later. Reconciling from scratch
// (rather than tracking an id per task) is simpler and self-healing — no
// stale notification can survive a task being edited, completed, or
// deleted, and it needs no server-side state.
export async function syncTaskNotifications(tasks) {
  await ensureSetup();
  await cancelOurs();

  const now = new Date();
  for (const t of tasks) {
    if (t.completed || !t.dueDate) continue;
    const fireAt = new Date(`${t.dueDate}T00:00:00`);
    fireAt.setHours(DUE_HOUR, 0, 0, 0);
    if (fireAt <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task due today",
        body: t.title,
        data: { type: NOTIFICATION_TYPE, taskId: t.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

export async function clearTaskNotifications() {
  await cancelOurs();
}
