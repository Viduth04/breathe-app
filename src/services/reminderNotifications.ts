// Check-in reminders - Ishara (Member 2). Supports FR05, NFR01.
//
// The device side of reminders: weekly LOCAL notifications (expo-notifications),
// scheduled from the reminders in users/{uid}/reminders. Nothing is sent to a
// server. The text is deliberately neutral (no mood or health details) because
// it can show on a lock screen.
//
// Web has no scheduled notifications: every function here is a safe no-op
// there and remindersSupported is false.

import type { Reminder } from "@/types/reminder";
import { parseTime } from "@/types/reminder";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const remindersSupported = Platform.OS !== "web";

export const REMINDER_CHANNEL_ID = "checkin-reminders";
const ID_PREFIX = "checkin-reminder-";
// Marks our notifications, so a tap opens check-in and nothing else does
export const REMINDER_DATA_TYPE = "checkin-reminder";

const CONTENT: Notifications.NotificationContentInput = {
  title: "Breathe",
  body: "Time for your daily check-in",
  data: { type: REMINDER_DATA_TYPE },
  sound: "default",
};

// Edits, toggles and syncs can overlap (e.g. a fast double toggle). Run them
// one at a time so the last change always wins.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

// ---------- SETUP ----------

let initialised = false;

// Show reminders while the app is open too, and create the Android channel
// (Settings > Notifications shows it as "Check-in reminders")
export async function initReminderNotifications() {
  if (!remindersSupported || initialised) return;
  initialised = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Check-in reminders",
      description: "Gentle reminders to do your daily check-in",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

// ---------- PERMISSION ----------

export type ReminderPermission = "granted" | "denied" | "undetermined" | "unsupported";

export async function getReminderPermission(): Promise<ReminderPermission> {
  if (!remindersSupported) return "unsupported";
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return "granted";
  // iOS "provisional" also delivers notifications (quietly)
  if (status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
    return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
}

// Asks the OS (only shows a prompt if it hasn't been answered before)
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!remindersSupported) return "unsupported";
  await initReminderNotifications(); // Android 13+ needs the channel first
  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return getReminderPermission();
}

// ---------- SCHEDULING ----------

const identifier = (reminderId: string, day: number) => `${ID_PREFIX}${reminderId}-${day}`;

async function cancelMatching(prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function schedule(reminder: Reminder) {
  if (!reminder.enabled) return;
  const { hour, minute } = parseTime(reminder.time);
  for (const day of reminder.days) {
    await Notifications.scheduleNotificationAsync({
      identifier: identifier(reminder.id, day),
      content: CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1, // expo: 1 = Sunday; ours: 0 = Sunday
        hour,
        minute,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  }
}

// After a create, edit or toggle: replace this reminder's notifications
export function rescheduleReminder(reminder: Reminder) {
  if (!remindersSupported) return Promise.resolve();
  return serial(async () => {
    await cancelMatching(`${ID_PREFIX}${reminder.id}-`);
    if ((await getReminderPermission()) === "granted") await schedule(reminder);
  });
}

// After a delete
export function cancelReminder(reminderId: string) {
  if (!remindersSupported) return Promise.resolve();
  return serial(() => cancelMatching(`${ID_PREFIX}${reminderId}-`));
}

// On login (and after permission is granted): this device schedules exactly
// the signed-in person's reminders, nobody else's
export function syncReminderNotifications(reminders: Reminder[]) {
  if (!remindersSupported) return Promise.resolve();
  return serial(async () => {
    await initReminderNotifications();
    await cancelMatching(ID_PREFIX);
    if ((await getReminderPermission()) !== "granted") return;
    for (const reminder of reminders) await schedule(reminder);
  });
}

// On logout and Delete My Data
export function cancelAllReminderNotifications() {
  if (!remindersSupported) return Promise.resolve();
  return serial(() => cancelMatching(ID_PREFIX));
}
