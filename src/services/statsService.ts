// Lecturer insights - Viduth (Member 1). Supports US05, NFR01.
//
// Anonymous weekly mood totals in stats/{weekId}. Nothing here identifies a
// student: no uid, no anonId, no per-person timestamp.

import { db } from "@/firebase/config";
import { factorKey, FactorKey, MoodLevel, WeekStats } from "@/types/stats";
import { dateKey, isoWeekId, recentWeeks, WeekRef, weekStartDate } from "@/utils/week";
import { doc, getDoc, increment, setDoc } from "firebase/firestore";

// ---------- WRITE (students) ----------

/**
 * ISHARA: call this ONCE, right after a student's check-in has been saved
 * to checkins/ (only after that write succeeds), with the mood they picked:
 *
 *   await saveCheckin(...);                 // your existing write
 *   recordAnonymousMoodStat(mood).catch(() => {}); // 1-5, fire and forget
 *
 * It adds 1 to this week's total and 1 to that mood's count, plus 1 to each
 * selected reason ("What's affecting your mood?") under factors.<key>. The security
 * rules only allow students to add exactly one check-in to the current week,
 * so don't call it twice for the same check-in, and don't await it in a way
 * that blocks the student if it fails - the check-in itself is what matters.
 */
export async function recordAnonymousMoodStat(
  mood: MoodLevel,
  factorLabels: readonly string[] = [],
) {
  const now = new Date();
  // Known keys only, each counted once (the rules allow +0 or +1 per key)
  const keys = new Set(
    factorLabels.map(factorKey).filter((k): k is FactorKey => k !== null),
  );
  const factors = Object.fromEntries([...keys].map((k) => [k, increment(1)]));
  await setDoc(
    doc(db, "stats", isoWeekId(now)),
    {
      weekStart: dateKey(weekStartDate(now)),
      total: increment(1),
      [`mood${mood}`]: increment(1),
      // Left out entirely when no reasons were picked
      ...(keys.size ? { factors } : {}),
    },
    { merge: true }, // Creates the week doc the first time, increments after that
  );
}

// ---------- READ (lecturers and admins only) ----------

export type WeekEntry = WeekRef & { stats: WeekStats | null }; // null = no doc yet

// The last `count` weeks including this one, oldest first
export async function getRecentWeekStats(count = 8): Promise<WeekEntry[]> {
  const weeks = recentWeeks(count);
  const snaps = await Promise.all(weeks.map((w) => getDoc(doc(db, "stats", w.id))));
  return weeks.map((week, i) => ({
    ...week,
    stats: snaps[i].exists() ? (snaps[i].data() as WeekStats) : null,
  }));
}
