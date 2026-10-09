/**
 * Supports FR05 by storing and managing a student's check-in reminder settings
 * in users/{uid}/reminders and updating this device's scheduled notifications.
 * Fixed IDs r1-r5 enforce the five-reminder limit because Firestore rules
 * cannot count documents.
 */

import { db } from "@/firebase/config";
import { withTimeout } from "@/services/checkinService";
import {
  cancelReminder,
  rescheduleReminder,
} from "@/services/reminderNotifications";
import {
  MAX_REMINDERS,
  Reminder,
  REMINDER_IDS,
  ReminderId,
  ReminderInput,
  TIME_PATTERN,
  Weekday,
} from "@/types/reminder";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const remindersOf = (uid: string) => collection(db, "users", uid, "reminders");

/**
 * Checks the reminder fields against the requirements used by Firestore rules.
 * @param input Time, selected days, and enabled state to validate.
 * @returns A student-facing validation message, or undefined when valid.
 */
export function reminderInputError(input: ReminderInput): string | undefined {
  if (!TIME_PATTERN.test(input.time)) return "Choose a time for your reminder.";
  if (!input.days.length) return "Choose at least one day.";
  if (input.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6))
    return "Choose at least one day.";
}

const clean = (input: ReminderInput): ReminderInput => ({
  time: input.time,
  days: [...new Set(input.days)].sort((a, b) => a - b) as Weekday[],
  enabled: input.enabled,
});

/**
 * Loads the student's reminders in time order.
 * @param uid ID of the student whose reminders to read.
 * @returns The student's reminders, earliest time first.
 */
export async function listReminders(uid: string): Promise<Reminder[]> {
  const snap = await getDocs(remindersOf(uid));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Reminder, "id">), id: d.id as ReminderId }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

// Thrown when all MAX_REMINDERS slots are used
export const REMINDER_LIMIT_ERROR = "reminders/limit";

/**
 * Creates a reminder in the first available fixed slot and schedules it locally.
 * @param uid ID of the student who owns the reminder.
 * @param input Reminder time, days, and enabled state.
 * @param existing Reminders already loaded for this student.
 * @returns The saved reminder.
 * @throws An error with REMINDER_LIMIT_ERROR when all five slots are used.
 */
export async function createReminder(
  uid: string,
  input: ReminderInput,
  existing: Reminder[],
): Promise<Reminder> {
  const used = new Set(existing.map((r) => r.id));
  const id = REMINDER_IDS.find((slot) => !used.has(slot));
  if (!id || existing.length >= MAX_REMINDERS) throw { code: REMINDER_LIMIT_ERROR };
  const data = clean(input);
  await withTimeout(
    setDoc(doc(remindersOf(uid), id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  const reminder: Reminder = { ...data, id, createdAt: null, updatedAt: null };
  // Saved either way; scheduling problems are logged, never block the save
  await rescheduleReminder(reminder).catch((e) =>
    console.warn("Scheduling reminder failed", e),
  );
  return reminder;
}

/**
 * Updates a reminder's time, days, or enabled state and refreshes its schedule.
 * @param uid ID of the student who owns the reminder.
 * @param existing Current reminder being changed.
 * @param input New time, days, and enabled state.
 * @returns The updated reminder.
 */
export async function updateReminder(
  uid: string,
  existing: Reminder,
  input: ReminderInput,
): Promise<Reminder> {
  const data = clean(input);
  await withTimeout(
    updateDoc(doc(remindersOf(uid), existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    }),
  );
  const reminder: Reminder = { ...existing, ...data };
  await rescheduleReminder(reminder).catch((e) =>
    console.warn("Rescheduling reminder failed", e),
  );
  return reminder;
}

/**
 * Deletes a student's reminder and cancels its scheduled notifications.
 * @param uid ID of the student who owns the reminder.
 * @param id Fixed reminder slot ID to delete.
 * @returns A promise that resolves when the deletion and cancellation finish.
 */
export async function deleteReminder(uid: string, id: ReminderId) {
  await withTimeout(deleteDoc(doc(remindersOf(uid), id)));
  await cancelReminder(id).catch((e) => console.warn("Cancelling reminder failed", e));
}
