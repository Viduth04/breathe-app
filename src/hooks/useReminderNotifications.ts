/**
 * Supports FR05 by syncing the signed-in student's reminders after login and
 * opening the check-in screen when a reminder notification is tapped.
 * Notification setup is handled by reminderNotifications.
 */

import { listReminders } from "@/services/reminderService";
import {
  initReminderNotifications,
  listenForReminderTaps,
  remindersSupported,
  syncReminderNotifications,
} from "@/services/reminderNotifications";
import { router } from "expo-router";
import { useEffect } from "react";

/**
 * Keeps local reminder notifications in sync with the current student.
 * @param uid Signed-in student's ID, or undefined when no student is signed in.
 */
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
