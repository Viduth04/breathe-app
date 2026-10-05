// Check-in reminders - Ishara (Member 2). Supports FR05.
//
// Shape of users/{uid}/reminders/{id}. firestore.rules checks EXACTLY these
// fields - change both together.

import type { Timestamp } from "firebase/firestore";

export const MAX_REMINDERS = 5;
// Doc ids are fixed slots, so the rules can cap reminders at MAX_REMINDERS
export const REMINDER_IDS = ["r1", "r2", "r3", "r4", "r5"] as const;
export type ReminderId = (typeof REMINDER_IDS)[number];

// 0 = Sunday ... 6 = Saturday (same as Date.getDay())
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Reminder = {
  id: ReminderId;
  time: string; // "HH:mm", 24-hour
  days: Weekday[]; // At least one, sorted
  enabled: boolean;
  createdAt: Timestamp | null; // null only while a local write is pending
  updatedAt: Timestamp | null;
};

export type ReminderInput = Pick<Reminder, "time" | "days" | "enabled">;

export const EVERY_DAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];

// Monday first, as students read a week
export const DAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const DAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const toTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

export function parseTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

// "08:30" -> "8:30 AM" (or "08:30" where the device uses 24-hour time)
export function formatTime(time: string) {
  const { hour, minute } = parseTime(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const sameDays = (a: Weekday[], b: Weekday[]) =>
  a.length === b.length && b.every((d) => a.includes(d));

// "Every day", "Weekdays", "Weekends", "Mon-Fri" style runs, or "Mon, Wed, Fri"
export function daysSummary(days: Weekday[], long = false) {
  if (sameDays(days, EVERY_DAY)) return "Every day";
  if (sameDays(days, WEEKDAYS)) return long ? "Monday to Friday" : "Mon-Fri";
  if (sameDays(days, [0, 6])) return "Weekends";
  const names = long ? DAY_LONG : DAY_SHORT;
  const ordered = DAY_ORDER.filter((d) => days.includes(d));
  // Consecutive runs of 3+ days read as a range
  const parts: string[] = [];
  let i = 0;
  while (i < ordered.length) {
    let j = i;
    while (
      j + 1 < ordered.length &&
      DAY_ORDER.indexOf(ordered[j + 1]) === DAY_ORDER.indexOf(ordered[j]) + 1
    )
      j++;
    if (j - i >= 2) parts.push(`${names[ordered[i]]}${long ? " to " : "-"}${names[ordered[j]]}`);
    else for (let k = i; k <= j; k++) parts.push(names[ordered[k]]);
    i = j + 1;
  }
  return parts.join(", ");
}
