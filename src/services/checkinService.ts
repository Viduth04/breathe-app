// Daily mood check-in service. Supports the daily mood check-in requirement.
// Uses Firestore's checkins collection and updates anonymous weekly stats in stats.
// Mood check-in - Ishara (Member 2). FR02, NFR03.
// Mood tracking - Ishara (Member 2). FR09.
//
// Students read and write only their own checkins/ docs (see firestore.rules).
// Admins and lecturers never touch this collection (NFR01).

import { auth, db } from "@/firebase/config";
import { recordAnonymousMoodStat } from "@/services/statsService";
import {
    CheckIn,
    CheckInInput,
    dateFromKey,
    MoodFactor,
    MoodLevel,
} from "@/types/checkin";
import { dateKey } from "@/utils/week";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";

// Offline writes never resolve until the server answers, so give up after this
// and let the student try again (their input stays on screen)
const SAVE_TIMEOUT_MS = 15000;

/**
 * Rejects a save if Firestore does not answer in time, so the student can retry.
 * @param promise The Firestore operation to wait for.
 * @returns The operation's result, or a rejection if it fails or times out.
 */
export function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject({ code: "unavailable" }), // Same message as Firestore offline
      SAVE_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// One doc per student per day, so retries and edits can't create duplicates
/**
 * Builds the Firestore document id for one student's check-in on one day.
 * @param uid The student's user id.
 * @param day The check-in date key.
 * @returns The document id, in uid_date format.
 */
export const checkinId = (uid: string, day: string) => `${uid}_${day}`;

const clean = (input: CheckInInput): CheckInInput => ({
  mood: input.mood,
  factors: [...input.factors],
  note: input.note.trim(),
});

// ---------- CHANGE EVENTS ----------

// Keeps the mounted tab screens (check-in, history, entry detail) in sync when
// another screen saves or deletes a check-in
export type CheckinChange =
  | { type: "saved"; checkin: CheckIn }
  | { type: "deleted"; id: string };

const listeners = new Set<(change: CheckinChange) => void>();

/**
 * Subscribes to local check-in save and delete events.
 * @param listener The function called when a check-in changes.
 * @returns A function that removes this listener.
 */
export function subscribeToCheckinChanges(
  listener: (change: CheckinChange) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const notify = (change: CheckinChange) => listeners.forEach((l) => l(change));

// ---------- READ ----------

// Today's check-in, or null if there isn't one yet. A query (not getDoc)
// because the rules deny reading a doc that doesn't exist.
/**
 * Gets the signed-in student's check-in for today.
 * @param uid The student's user id.
 * @returns Today's check-in, or null if none exists.
 */
export async function getTodayCheckin(uid: string): Promise<CheckIn | null> {
  const snap = await getDocs(
    query(
      collection(db, "checkins"),
      where("userId", "==", uid),
      where("dateKey", "==", dateKey(new Date())),
      limit(1),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { ...(d.data() as Omit<CheckIn, "id">), id: d.id };
}

/**
 * The signed-in student's check-ins, newest first.
 *   days  - only the last N days, including today
 *   limit - at most this many entries
 *
 * Filters only on userId (which the rules require) and sorts/trims here, so no
 * composite index is needed. That stays cheap: one doc per student per day.
 * @param options Optional date range and maximum result count.
 * @returns The student's matching check-ins, newest first.
 */
export async function listMyCheckins({
  days,
  limit: max,
}: { days?: number; limit?: number } = {}): Promise<CheckIn[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw { code: "permission-denied" };
  const snap = await getDocs(
    query(collection(db, "checkins"), where("userId", "==", uid)),
  );
  const since = days ? dayKeyBefore(dateKey(new Date()), days - 1) : null;
  const list = snap.docs
    .map((d) => ({ ...(d.data() as Omit<CheckIn, "id">), id: d.id }))
    .filter((c) => !since || c.dateKey >= since) // "YYYY-MM-DD" sorts as text
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  return max ? list.slice(0, max) : list;
}

// One check-in, or null if it doesn't exist. The rules deny reading a missing
// doc, so for the owner permission-denied means "not found".
/**
 * Gets one check-in by document id.
 * @param id The check-in document id.
 * @returns The check-in, or null if it does not exist or is not readable.
 */
export async function getCheckin(id: string): Promise<CheckIn | null> {
  try {
    const snap = await getDoc(doc(db, "checkins", id));
    return snap.exists()
      ? { ...(snap.data() as Omit<CheckIn, "id">), id: snap.id }
      : null;
  } catch (e: any) {
    if (e?.code === "permission-denied") return null;
    throw e;
  }
}

// ---------- CREATE ----------

/**
 * Creates today's check-in and records its mood in anonymous weekly stats.
 * @param uid The student's user id.
 * @param input The mood, selected factors, and note to save.
 * @returns The saved check-in.
 */
export async function createCheckin(
  uid: string,
  input: CheckInInput,
): Promise<CheckIn> {
  const day = dateKey(new Date());
  const data = { ...clean(input), userId: uid, dateKey: day };
  const id = checkinId(uid, day);
  await withTimeout(
    setDoc(doc(db, "checkins", id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  // Anonymous weekly total for lecturers; only after the check-in is saved,
  // and never blocks the student if it fails
  recordAnonymousMoodStat(data.mood, data.factors).catch(() => {});
  const checkin = { ...data, id };
  notify({ type: "saved", checkin });
  return checkin;
}

// ---------- UPDATE ----------

// Edits today's entry. Not counted again in the weekly stats.
/**
 * Updates an existing check-in without counting it again in weekly stats.
 * @param existing The check-in to update.
 * @param input The replacement mood, factors, and note.
 * @returns The updated check-in.
 */
export async function updateCheckin(
  existing: CheckIn,
  input: CheckInInput,
): Promise<CheckIn> {
  const data = clean(input);
  await withTimeout(
    updateDoc(doc(db, "checkins", existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    }),
  );
  const checkin = { ...existing, ...data };
  notify({ type: "saved", checkin });
  return checkin;
}

// ---------- DELETE ----------

// Any entry, any day. Lecturer stats are left alone: they're anonymous weekly
// totals with nothing linking them back to this check-in.
/**
 * Deletes a check-in without changing anonymous weekly totals.
 * @param id The check-in document id.
 * @returns A promise that resolves when the delete is saved.
 */
export async function deleteCheckin(id: string) {
  await withTimeout(deleteDoc(doc(db, "checkins", id)));
  notify({ type: "deleted", id });
}

// ---------- PURE HELPERS (charts and insights) ----------

// "YYYY-MM-DD" n days before the given day key
/**
 * Gets the date key a number of days before another date key.
 * @param key The starting date key in YYYY-MM-DD format.
 * @param n The number of days to go back.
 * @returns The earlier date key in YYYY-MM-DD format.
 */
export function dayKeyBefore(key: string, n: number) {
  const d = dateFromKey(key);
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

// Average mood 1-5, or null for an empty list
/**
 * Calculates the average mood for a list of check-ins.
 * @param list The check-ins to include.
 * @returns The average mood, or null if the list is empty.
 */
export const averageMood = (list: CheckIn[]) =>
  list.length ? list.reduce((sum, c) => sum + c.mood, 0) / list.length : null;

export type MoodDay = { dateKey: string; date: Date; mood: MoodLevel | null };

// One slot per day for the last `days` days, oldest first. Days without a
// check-in are null (a gap in the chart, never zero).
/**
 * Creates one mood chart entry per day, from oldest to newest.
 * @param list The check-ins to place on the chart.
 * @param days The number of days to include.
 * @param today The date to treat as today; defaults to the current date.
 * @returns Daily mood entries, with null for days without a check-in.
 */
export function moodByDay(list: CheckIn[], days: number, today = new Date()) {
  const byKey = new Map(list.map((c) => [c.dateKey, c.mood]));
  const todayKey = dateKey(today);
  return Array.from({ length: days }, (_, i): MoodDay => {
    const key = dayKeyBefore(todayKey, days - 1 - i);
    return { dateKey: key, date: dateFromKey(key), mood: byKey.get(key) ?? null };
  });
}

// Consecutive days with a check-in, ending today. If today has no check-in
// yet, the streak still counts up to yesterday (the day isn't over).
/**
 * Counts consecutive check-in days ending today or yesterday.
 * @param list The check-ins to use when counting the streak.
 * @param today The date to treat as today; defaults to the current date.
 * @returns The current streak length in days.
 */
export function currentStreak(list: CheckIn[], today = new Date()) {
  const days = new Set(list.map((c) => c.dateKey));
  let key = dateKey(today);
  if (!days.has(key)) key = dayKeyBefore(key, 1);
  let streak = 0;
  while (days.has(key)) {
    streak += 1;
    key = dayKeyBefore(key, 1);
  }
  return streak;
}

// No pattern is shown until there's enough to go on
export const MIN_ENTRIES_FOR_PATTERNS = 5;
// A difference smaller than this (on the 1-5 scale) isn't worth mentioning
const MEANINGFUL_GAP = 0.75;

/**
 * Plain-language observations, strongest first (at most 3). Empty until there
 * are MIN_ENTRIES_FOR_PATTERNS check-ins. Worded as reflections, not diagnoses.
 * @param list The check-ins to analyze.
 * @returns Up to three plain-language observations, strongest first.
 */
export function detectPatterns(list: CheckIn[]): string[] {
  if (list.length < MIN_ENTRIES_FOR_PATTERNS) return [];
  const found: { gap: number; text: string }[] = [];

  // Factors: days tagged with it vs days without it (at least 2 of each)
  const factors = new Set<MoodFactor>(list.flatMap((c) => c.factors ?? []));
  factors.forEach((factor) => {
    const tagged = list.filter((c) => c.factors?.includes(factor));
    const other = list.filter((c) => !c.factors?.includes(factor));
    if (tagged.length < 2 || other.length < 2) return;
    const gap = averageMood(tagged)! - averageMood(other)!;
    if (Math.abs(gap) < MEANINGFUL_GAP) return;
    found.push({
      gap: Math.abs(gap),
      text: `Your mood is usually ${gap < 0 ? "lower" : "higher"} on days you tag ${factor}.`,
    });
  });

  // Weekends vs weekdays
  const isWeekend = (c: CheckIn) => [0, 6].includes(dateFromKey(c.dateKey).getDay());
  const weekend = list.filter(isWeekend);
  const weekday = list.filter((c) => !isWeekend(c));
  if (weekend.length >= 2 && weekday.length >= 2) {
    const gap = averageMood(weekend)! - averageMood(weekday)!;
    if (Math.abs(gap) >= MEANINGFUL_GAP) {
      found.push({
        gap: Math.abs(gap),
        text: `You tend to feel ${gap > 0 ? "better" : "lower"} at weekends than on weekdays.`,
      });
    }
  }

  // Direction: the newer half of the entries vs the older half
  const sorted = [...list].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const half = Math.floor(sorted.length / 2);
  const trend = averageMood(sorted.slice(-half))! - averageMood(sorted.slice(0, half))!;
  if (Math.abs(trend) >= MEANINGFUL_GAP) {
    found.push({
      gap: Math.abs(trend),
      text:
        trend > 0
          ? "Your recent check-ins are brighter than your earlier ones."
          : "Your recent check-ins are lower than your earlier ones. Talking to someone can help.",
    });
  }

  return found
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((p) => p.text);
}
