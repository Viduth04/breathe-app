// Check-in reminders - Ishara (Member 2). Supports FR05, NFR01.
//
// The device side of reminders: weekly LOCAL notifications (expo-notifications),
// scheduled from the reminders in users/{uid}/reminders. Nothing is sent to a
// server. The text is deliberately neutral (no mood or health details) because
// it can show on a lock screen.
//
// Where notifications can't work, every function here is a safe no-op and
// remindersSupported is false (the reminders themselves are still saved):
//   - web: no scheduled notifications
//   - Expo Go on Android: since SDK 53 expo-notifications throws as soon as it
//     is imported there, so it is never imported at the top of any file. It is
//     only require()d inside functions, and only where it is supported.
//     iOS Expo Go and installed (dev/APK) builds are unaffected.

import type { Reminder } from "@/types/reminder";
import { parseTime } from "@/types/reminder";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type * as NotificationsModule from "expo-notifications";
import { Platform } from "react-native";

export type RemindersUnsupportedReason = "web" | "android-expo-go";

// "storeClient" = running inside the Expo Go app from the store
export const remindersUnsupportedReason: RemindersUnsupportedReason | null =
  Platform.OS === "web"
    ? "web"
    : Platform.OS === "android" &&
        Constants.executionEnvironment === ExecutionEnvironment.StoreClient
      ? "android-expo-go"
      : null;

export const remindersSupported = remindersUnsupportedReason === null;

// Loaded on first use; null when unsupported or if loading fails
let notificationsModule: typeof NotificationsModule | null | undefined;
function getNotifications(): typeof NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  notificationsModule = null;
  if (!remindersSupported) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require("expo-notifications") as typeof NotificationsModule;
  } catch (e) {
    console.warn("expo-notifications is not available", e);
  }
  return notificationsModule;
}

export const REMINDER_CHANNEL_ID = "checkin-reminders";
const ID_PREFIX = "checkin-reminder-";
// Marks our notifications, so a tap opens check-in and nothing else does
export const REMINDER_DATA_TYPE = "checkin-reminder";

const CONTENT: NotificationsModule.NotificationContentInput = {
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
  const Notifications = getNotifications();
  if (!Notifications || initialised) return;
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
  const Notifications = getNotifications();
  if (!Notifications) return "unsupported";
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return "granted";
  // iOS "provisional" also delivers notifications (quietly)
  if (status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
    return "granted";
  return status.canAskAgain ? "undetermined" : "denied";
}

// Asks the OS (only shows a prompt if it hasn't been answered before)
export async function requestReminderPermission(): Promise<ReminderPermission> {
  const Notifications = getNotifications();
  if (!Notifications) return "unsupported";
  await initReminderNotifications(); // Android 13+ needs the channel first
  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return getReminderPermission();
}

// ---------- SCHEDULING ----------

const identifier = (reminderId: string, day: number) => `${ID_PREFIX}${reminderId}-${day}`;

async function cancelMatching(Notifications: typeof NotificationsModule, prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function schedule(Notifications: typeof NotificationsModule, reminder: Reminder) {
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
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(async () => {
    await cancelMatching(Notifications, `${ID_PREFIX}${reminder.id}-`);
    if ((await getReminderPermission()) === "granted") await schedule(Notifications, reminder);
  });
}

// After a delete
export function cancelReminder(reminderId: string) {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(() => cancelMatching(Notifications, `${ID_PREFIX}${reminderId}-`));
}

// On login (and after permission is granted): this device schedules exactly
// the signed-in person's reminders, nobody else's
export function syncReminderNotifications(reminders: Reminder[]) {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(async () => {
    await initReminderNotifications();
    await cancelMatching(Notifications, ID_PREFIX);
    if ((await getReminderPermission()) !== "granted") return;
    for (const reminder of reminders) await schedule(Notifications, reminder);
  });
}

// On logout and Delete My Data
export function cancelAllReminderNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(() => cancelMatching(Notifications, ID_PREFIX));
}

// ---------- TAPS ----------

// Responses already acted on (the "last response" survives until cleared)
const handledTaps = new Set<string>();

// Calls onOpen when a check-in reminder is tapped, also when the tap is what
// launched the app. Returns an unsubscribe function (a no-op if unsupported).
export function listenForReminderTaps(onOpen: () => void): () => void {
  const Notifications = getNotifications();
  if (!Notifications) return () => {};
  const handle = (response: NotificationsModule.NotificationResponse | null) => {
    if (!response) return;
    const { identifier: id, content } = response.notification.request;
    if (content.data?.type !== REMINDER_DATA_TYPE) return;
    const key = `${id}@${response.notification.date}`;
    if (handledTaps.has(key)) return;
    handledTaps.add(key);
    onOpen();
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };

  Notifications.getLastNotificationResponseAsync()
    .then(handle)
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}
