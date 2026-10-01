// Lecturer insights - Viduth (Member 1).
//
// Shape of stats/{weekId} (e.g. stats/2026-W40): anonymous weekly totals only.
// There is no uid, anonId or per-person timestamp anywhere in these docs.

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: "Very low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

// Weeks with fewer check-ins than this never show a breakdown or average,
// so nobody can work out how an individual student felt
export const MIN_RESPONSES = 5;

export type WeekStats = {
  weekStart: string; // "YYYY-MM-DD", the Monday of that week (local time)
  total: number;
  mood1?: number;
  mood2?: number;
  mood3?: number;
  mood4?: number;
  mood5?: number;
  demo?: boolean; // Sample data loaded by an admin for demos
};

export const moodCount = (week: WeekStats, level: MoodLevel) =>
  week[`mood${level}`] ?? 0;

// Average mood 1-5, or null when there are no check-ins
export const averageMood = (week: WeekStats) =>
  week.total > 0
    ? MOOD_LEVELS.reduce((sum, level) => sum + level * moodCount(week, level), 0) /
      week.total
    : null;

export const isSafeToShow = (week: WeekStats | null) =>
  !!week && week.total >= MIN_RESPONSES;
