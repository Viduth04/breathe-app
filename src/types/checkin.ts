// Mood check-in - Ishara (Member 2). FR02, NFR03.
//
// Shape of checkins/{uid}_{YYYY-MM-DD}: one check-in per student per local day.
// The doc id makes a second save on the same day an update, never a duplicate.

import { MOOD_LABELS, MoodLevel } from "@/types/stats";
import type { Timestamp } from "firebase/firestore";

export type { MoodLevel };

// Mood scale shared by Home and the check-in screen; index = level - 1
export const MOODS: { level: MoodLevel; emoji: string; label: string }[] = [
  { level: 1, emoji: "😢", label: MOOD_LABELS[1] },
  { level: 2, emoji: "😕", label: MOOD_LABELS[2] },
  { level: 3, emoji: "😐", label: MOOD_LABELS[3] },
  { level: 4, emoji: "🙂", label: MOOD_LABELS[4] },
  { level: 5, emoji: "😄", label: MOOD_LABELS[5] },
];

// Optional "What's affecting your mood?" chips
export const MOOD_FACTORS = [
  "Studies",
  "Exams",
  "Sleep",
  "Health",
  "Family",
  "Friends",
  "Relationships",
  "Money",
  "Work",
  "Loneliness",
  "Other",
] as const;

export type MoodFactor = (typeof MOOD_FACTORS)[number];

export const NOTE_MAX_LENGTH = 300;

export type CheckIn = {
  id: string;
  userId: string;
  dateKey: string; // "YYYY-MM-DD" in the phone's local time
  mood: MoodLevel;
  factors: MoodFactor[];
  note: string;
  createdAt?: Timestamp | null; // Set by the server
  updatedAt?: Timestamp | null;
};

// What the screen sends; everything else is filled in by the service
export type CheckInInput = Pick<CheckIn, "mood" | "factors" | "note">;

export const isMoodLevel = (value: unknown): value is MoodLevel =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

// Mood tracking - Ishara (Member 2). FR09.

// "YYYY-MM-DD" -> local midnight of that day
export function dateFromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// "Thursday, 2 October"
export const longDate = (key: string) =>
  dateFromKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

// "Thu 2 Oct"
export const shortDay = (key: string) =>
  dateFromKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// Nearest mood level for an average, e.g. 3.6 -> 4 ("Good")
export const nearestMood = (avg: number) =>
  Math.min(5, Math.max(1, Math.round(avg))) as MoodLevel;
