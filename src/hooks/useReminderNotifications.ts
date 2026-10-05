// Check-in reminders - Ishara (Member 2). Supports FR05.
//
// Mounted once in the student layout:
//   - after login, schedules this person's reminders on this device again
//     (logout cancels them, and another person may have used the device)
//   - tapping a reminder notification opens the check-in screen, also when
//     the tap is what launched the app

import { listReminders } from "@/services/reminderService";
import {
  initReminderNotifications,
  REMINDER_DATA_TYPE,
  remindersSupported,
  syncReminderNotifications,
} from "@/services/reminderNotifications";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

// Responses already acted on (the "last response" survives until cleared)
const handled = new Set<string>();

function openCheckIn(response: Notifications.NotificationResponse | null) {
  if (!response) return;
  const { identifier, content } = response.notification.request;
  if (content.data?.type !== REMINDER_DATA_TYPE) return;
  const key = `${identifier}@${response.notification.date}`;
  if (handled.has(key)) return;
  handled.add(key);
  router.navigate("/(student)/check-in");
  Notifications.clearLastNotificationResponseAsync().catch(() => {});
}

export function useReminderNotifications(uid: string | undefined) {
  // Re-sync on login (and when another account signs in on this device)
  useEffect(() => {
    if (!remindersSupported || !uid) return;
    let active = true;
    (async () => {
      try {
        await initReminderNotifications();
        const reminders = await listReminders(uid);
        if (active) await syncReminderNotifications(reminders);
      } catch (e) {
        console.warn("Syncing reminder notifications failed", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  // Taps
  useEffect(() => {
    if (!remindersSupported) return;
    Notifications.getLastNotificationResponseAsync()
      .then(openCheckIn)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(openCheckIn);
    return () => sub.remove();
  }, []);
}
