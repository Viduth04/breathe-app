// Check-in reminders - Ishara (Member 2). Supports FR05, NFR01.
//
// Create, read, update and delete the signed-in student's reminders in
// users/{uid}/reminders (owner only, see firestore.rules), and keep this
// device's scheduled notifications in step after every change.

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

// Same checks as validReminder() in firestore.rules
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

// Earliest time first
export async function listReminders(uid: string): Promise<Reminder[]> {
  const snap = await getDocs(remindersOf(uid));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Reminder, "id">), id: d.id as ReminderId }))
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

// Thrown when all MAX_REMINDERS slots are used
export const REMINDER_LIMIT_ERROR = "reminders/limit";

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

// Edit time/days, or switch on/off (createdAt is left alone, as the rules require)
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

export async function deleteReminder(uid: string, id: ReminderId) {
  await withTimeout(deleteDoc(doc(remindersOf(uid), id)));
  await cancelReminder(id).catch((e) => console.warn("Cancelling reminder failed", e));
}
