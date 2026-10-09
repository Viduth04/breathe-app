/**
 * Supports FR05 by scheduling and managing weekly local check-in notifications
 * from saved reminder settings. The neutral text protects privacy on lock
 * screens. expo-notifications is loaded lazily because importing it crashes
 * Android Expo Go; unsupported platforms keep saved reminders but do not notify.
 */

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
    // Load only when needed: Android Expo Go can crash if this module is imported.
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
/**
 * Sets up foreground display behavior and the Android reminder channel.
 * @returns A promise that resolves after notification setup.
 */
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

/**
 * Reads the current permission state for reminder notifications.
 * @returns Whether permission is granted, denied, still askable, or unsupported.
 */
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

/**
 * Requests operating-system permission to show check-in reminder notifications.
 * @returns The resulting permission state.
 */
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

/**
 * Replaces the scheduled notifications for one reminder.
 * @param reminder Saved reminder whose schedule should be refreshed.
 * @returns A promise that resolves when its notifications are updated.
 */
export function rescheduleReminder(reminder: Reminder) {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(async () => {
    await cancelMatching(Notifications, `${ID_PREFIX}${reminder.id}-`);
    if ((await getReminderPermission()) === "granted") await schedule(Notifications, reminder);
  });
}

/**
 * Cancels scheduled notifications for one reminder.
 * @param reminderId Fixed ID of the reminder to cancel.
 * @returns A promise that resolves when matching notifications are cancelled.
 */
export function cancelReminder(reminderId: string) {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(() => cancelMatching(Notifications, `${ID_PREFIX}${reminderId}-`));
}

/**
 * Replaces this device's reminder schedules with the signed-in student's list.
 * Called after login and when notification permission is granted.
 * @param reminders Reminders belonging to the signed-in student.
 * @returns A promise that resolves when schedules are synced.
 */
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

/**
 * Cancels all check-in reminder notifications on this device.
 * Used on logout and when the student deletes their data.
 * @returns A promise that resolves when matching notifications are cancelled.
 */
export function cancelAllReminderNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) return Promise.resolve();
  return serial(() => cancelMatching(Notifications, ID_PREFIX));
}

// ---------- TAPS ----------

// Responses already acted on (the "last response" survives until cleared)
const handledTaps = new Set<string>();

/**
 * Runs a callback when the student taps a check-in reminder notification,
 * including when that tap launches the app.
 * @param onOpen Action to run after a reminder notification is tapped.
 * @returns A function that stops listening for notification taps.
 */
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
