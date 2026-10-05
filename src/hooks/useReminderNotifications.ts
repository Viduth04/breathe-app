// Check-in reminders - Ishara (Member 2). Supports FR05.
//
// Mounted once in the student layout:
//   - after login, schedules this person's reminders on this device again
//     (logout cancels them, and another person may have used the device)
//   - tapping a reminder notification opens the check-in screen, also when
//     the tap is what launched the app
// Never imports expo-notifications itself (it crashes Android Expo Go); where
// notifications are unsupported both effects do nothing.

import { listReminders } from "@/services/reminderService";
import {
  initReminderNotifications,
  listenForReminderTaps,
  remindersSupported,
  syncReminderNotifications,
} from "@/services/reminderNotifications";
import { router } from "expo-router";
import { useEffect } from "react";

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
    try {
      return listenForReminderTaps(() => router.navigate("/(student)/check-in"));
    } catch (e) {
      console.warn("Listening for reminder taps failed", e);
    }
  }, []);
}
