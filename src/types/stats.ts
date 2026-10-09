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
  // Anonymous count of check-ins that tagged each reason, e.g. { exams: 12 }.
  // A check-in can tag several reasons (or none), so these don't add up to total.
  factors?: Partial<Record<FactorKey, number>>;
  demo?: boolean; // Sample data loaded by an admin for demos
};

// Firestore keys for the "What's affecting your mood?" chips (MOOD_FACTORS in
// types/checkin.ts). firestore.rules only accepts these keys - keep in sync.
export const FACTOR_KEYS = [
  "studies",
  "exams",
  "sleep",
  "health",
  "family",
  "friends",
  "relationships",
  "money",
  "work",
  "loneliness",
  "other",
] as const;

export type FactorKey = (typeof FACTOR_KEYS)[number];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  studies: "Studies",
  exams: "Exams",
  sleep: "Sleep",
  health: "Health",
  family: "Family",
  friends: "Friends",
  relationships: "Relationships",
  money: "Money",
  work: "Work",
  loneliness: "Loneliness",
  other: "Other",
};

// "Exams" -> "exams"; null for anything that isn't a known factor
export const factorKey = (label: string): FactorKey | null => {
  const key = label.toLowerCase() as FactorKey;
  return FACTOR_KEYS.includes(key) ? key : null;
};

export const factorCount = (week: WeekStats, key: FactorKey) =>
  week.factors?.[key] ?? 0;

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
